<template>
  <drop 
    class="sequencer sequencer-child"
    group="arranger"
    @drop="handleDrop"
  >
    <!-- 
      We need this child element for scroll reasons.
      See https://stackoverflow.com/questions/16670931/hide-scroll-bar-but-while-still-being-able-to-scroll
     -->
    <!-- <div class="sequencer-child" @scroll="scroll" ref="scroller"> -->
    <div class="select-area" :style="selectStyle"></div>
    <div
      class="layer rows" 
      ref="rows" 
      :style="`height: ${numRows * rowHeight}px`"
    >
      <div
        v-for="row in numRows" 
        :key="row"
        :row="row - 1"
        :total-beats="displayBeats"
        :style="actualRowStyle(row - 1)"
        :class="rowClass(row - 1)"
        @click="add($event)"
        @contextmenu="$event.preventDefault()"
        @mousedown="selectStart"
      ></div>
    </div>
    <beat-lines
      :px-per-beat="pxPerBeat"
      :beats-per-measure="beatsPerMeasure"
      :steps-per-beat="stepsPerBeat"
      :style="sequencerStyle"
      class="layer lines"
    ></beat-lines>
    <component
      v-for="(ghost, i) in ghostsComponents"
      :is="ghost.name"
      :left="ghost.left"
      :top="ghost.top"
      :px-per-beat="pxPerBeat"
      :style="{ position: 'absolute', 'z-index': 2, height: `${rowHeight}px` }"
      :key="i"
      :ghost="ghost.ghost"
    ></component>
    <component
      v-for="(component, i) in components"
      :is="component.name"
      :left="component.left"
      :top="component.top"
      :row="component.row"
      :height="rowHeight"
      :snap="snap"
      :px-per-beat="pxPerBeat"
      style="position: absolute; z-index: 2"
      :key="i"
      :element="component.element"
      :selected="selected[i]"
      :duration="component.duration"
      @update:duration="updateDuration(i, $event)"
      @contextmenu.native="remove($event, i)"
      @mousedown.native="select($event, i)"
      @click.native="clickElement(i)"
      @dblclick="open($event, i)"
    ></component>
    <progression
      :loop-start="loopStart"
      :loop-end="loopEnd"
      :progress="progress"
      :px-per-beat="pxPerBeat"
      class="progress-bar"
    ></progression>
    <div 
      class="loop-background loop-background--left" 
      :style="leftStyle"
    ></div>
    <div 
      class="loop-background loop-background--right" 
      :style="rightStyle"
    ></div>
  </drop>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Inject, Vue } from 'vue-property-decorator';
import { range, Nullable, Keys, reverse, addEventListeners } from '@/utils';
import BeatLines from '@/modules/sequencer/BeatLines';
import Progression from '@/modules/sequencer/Progression.vue';
import { Watch } from '@/modules/update';
import { Schedulable, Sequence } from '@/core';
import { Ghost } from '@/core/ghost';

@Component({
  components: { Progression, BeatLines },
})
export default class SequencerGrid extends Vue {
  // name is used for debugging
  @Prop({ type: String, required: true }) public name!: string;
  @Prop({ type: Number, required: true }) public rowHeight!: number;
  @Prop({ type: Object, required: true }) public sequence!: Sequence<Schedulable>;
  // @Prop({ type: Array, required: true }) public elements!: Schedulable[];
  @Prop({ type: Array, default: null }) public ghosts!: Ghost[] | null;
  @Prop({ type: Number, default: 0.25 }) public snap!: number;

  @Prop({ type: Number, required: true }) public pxPerBeat!: number;
  @Prop({ type: Number, required: true }) public beatsPerMeasure!: number;
  @Prop({ type: Number, required: true }) public stepsPerBeat!: number;

  @Prop({ type: Number, required: true }) public numRows!: number;
  @Prop({ type: Function, default: () => ({}) }) public rowStyle!: (row: number) => object;
  @Prop({ type: Function, default: () => undefined }) public rowClass!: (row: number) => string;

  // These are for the progression.
  @Prop({ type: Number, required: true }) public loopEnd!: number;
  @Prop({ type: Number, required: true }) public loopStart!: number;

  // The loop end determined by the items.
  @Prop({ type: Number, required: true }) public sequencerLoopEnd!: number;

  // These values should only be set if there is a loop on the timeline
  @Prop(Nullable(Number)) public setLoopEnd!: number | null;
  @Prop(Nullable(Number)) public setLoopStart!: number | null;
  @Prop({ type: Number, required: true }) public progress!: number;

  // FIXME edge case -> what happens if the element is deleted?
  @Prop(Nullable(Object)) public prototype!: Schedulable | null;

  @Prop({ type: Number, required: true }) public displayLoopEnd!: number;

  public cursor = 'move';
  public rows!: HTMLElement;
  public selectStartEvent: MouseEvent | null = null;
  public dragStartEvent: MouseEvent | null = null;
  public selectCurrentEvent: MouseEvent | null = null;
  public holdingShift = false;
  public minDisplayMeasures = 4;
  public itemLoopEnd: number | null = null;
  // selected[i] indicates whether elements[i] is selected
  public selected: boolean[] = [];

  get elements() {
    return this.sequence.elements;
  }

  get components() {
    return this.elements.map((item) => {
      return {
        row: item.row,
        left: item.time * this.pxPerBeat,
        top: item.row * this.rowHeight,
        name: item.component,
        duration: item.duration,
        element: item,
      };
    });
  }

  get ghostsComponents() {
    if (this.ghosts === null) {
      return;
    }

    return this.ghosts.map((item) => {
      return {
        row: item.row,
        left: item.time * this.pxPerBeat,
        top: item.row * this.rowHeight,
        name: item.component,
        ghost: item,
      };
    });
  }

  get sequencerStyle() {
    return {
      width: `${this.displayBeats * this.pxPerBeat}px`,
      height: `${this.numRows * this.rowHeight}px`,
    };
  }

  get leftStyle() {
    if (this.setLoopStart) {
      return {
        width: `${this.setLoopStart * this.pxPerBeat}px`,
      };
    }
  }

  get rightStyle() {
    if (this.setLoopEnd) {
      const left = this.setLoopEnd * this.pxPerBeat;
      return {
        left: `${left}px`,
        width: `${this.displayBeats * this.pxPerBeat - left}px`,
      };
    }
  }

  get displayBeats() {
    return Math.max(
      256, // 256 is completly random
      (this.itemLoopEnd || 0) + this.beatsPerMeasure * 2,
    );
  }

  get selectStyle() {
    if (!this.selectStartEvent) { return; }
    if (!this.selectCurrentEvent) {
      this.selected = this.selected.map((_) => false);
      return;
    }

    const boundingRect = this.rows.getBoundingClientRect();

    const left = Math.min(
      this.selectStartEvent.clientX - boundingRect.left,
      this.selectCurrentEvent.clientX - boundingRect.left,
    );
    const top = Math.min(
      this.selectStartEvent.clientY - boundingRect.top,
      this.selectCurrentEvent.clientY - boundingRect.top,
    );

    const width = Math.abs(this.selectCurrentEvent.clientX - this.selectStartEvent.clientX);
    const height = Math.abs(this.selectCurrentEvent.clientY - this.selectStartEvent.clientY);

    // these are exact numbers BTW, not integers
    const minBeat = left / this.pxPerBeat;
    const minRow = top / this.rowHeight;
    const maxBeat = (left + width) / this.pxPerBeat;
    const maxRow = (top + height) / this.rowHeight;

    this.elements.forEach((item, i) => {
      // Check if there is any overlap between the rectangles
      // https://www.geeksforgeeks.org/find-two-rectangles-overlap/
      if (minRow > item.row + 1 || item.row > maxRow) {
        this.selected[i] = false;
      } else if (minBeat > item.time + item.duration || item.time > maxBeat) {
        this.selected[i] = false;
      } else {
        this.selected[i] = true;
      }
    });

    return {
      position: 'absolute',
      borderRadius: '5px',
      border: 'solid 1px red',
      backgroundColor: 'rgba(255, 51, 51, 0.3)',
      left: `${left}px`,
      top: `${top}px`,
      height: `${height}px`,
      width: `${width}px`,
      zIndex: 3,
    };
  }

  public mounted() {
    this.rows = this.$refs.rows as HTMLElement;
    this.checkLoopEnd();
    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);
  }

  public destroyed() {
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
  }

  public actualRowStyle(i: number) {
    const style = this.rowStyle(i);
    return {
      ...style,
      height: `${this.rowHeight}px`,
      width: `${this.pxPerBeat * this.displayBeats}px`,
    };
  }

  public updateDuration(i: number, value: number) {
    const item = this.elements[i];
    const diff = value - item.duration;

    const updateDuration = (index: number) => {
      // Ok so we update both the duration of getter and the duraion of the element
      // This DEfinitely might not be needed
      this.components[index].duration += diff;
      this.elements[index].duration += diff;
    };

    const toUpdate = [i];
    if (this.selected[i]) {
      this.selected.forEach((selected, ind) => {
        if (selected && ind !== i) {
          toUpdate.push(ind);
        }
      });
    }

    // If the diff is less than zero, make sure we aren't settings the length of
    // any of the elments to <= 0
    if (diff < 0 && toUpdate.some((ind) => this.elements[ind].duration + diff <= 0)) {
      return;
    }

    toUpdate.forEach(updateDuration);

    // Make sure to check the loop end when the duration of an element has been changed!!
    this.checkLoopEnd();
  }

  public selectStart(e: MouseEvent) {
    this.selectStartEvent = e;
    window.addEventListener('mousemove', this.selectMove);
    window.addEventListener('mouseup', this.selectEnd);
  }

  public selectMove(e: MouseEvent) {
    this.selectCurrentEvent = e;
  }

  public selectEnd() {
    this.selectStartEvent = null;
    this.selectCurrentEvent = null;
    window.removeEventListener('mousemove', this.selectMove);
    window.removeEventListener('mouseup', this.selectEnd);
  }

  public add(e: MouseEvent) {
    if (!this.prototype) {
      return;
    }

    const rect = this.$el.getBoundingClientRect();

    const x = e.clientX - rect.left;
    let time = x / this.pxPerBeat;
    time = Math.floor(time / this.snap) * this.snap;

    const y = e.clientY - rect.top;
    const row = Math.floor(y / this.rowHeight);

    const item = this.prototype.copy();
    item.row = row;
    item.time = time;

    this.selected.push(false);
    this.sequence.push(item);
  }

  public move(e: MouseEvent, i: number) {
    if (!this.dragStartEvent) {
      return;
    }

    // Get the preVIOUS element first
    // and ALSO grab the current position
    const oldItem = this.elements[i];
    const rect = this.rows.getBoundingClientRect();

    // Get the start BEAT
    let startBeat = (this.dragStartEvent.clientX - rect.left) / this.pxPerBeat;
    startBeat = Math.floor(startBeat / this.snap) * this.snap;

    // Get the end BEAT
    let endBeat = (e.clientX - rect.left) / this.pxPerBeat;
    endBeat = Math.floor(endBeat / this.snap) * this.snap;

    // CHeck if we are going to move squares
    const diff = endBeat - startBeat;
    const time = oldItem.time + diff;
    if (time < 0) { return; }

    const y = e.clientY - rect.top;
    const row = Math.floor(y / this.rowHeight);
    if (row < 0) { return; }

    if (row === oldItem.row && time === oldItem.time) { return; }
    // OK, so we've moved squares
    // Lets update our dragStartEvent or else
    // things will start to go haywyre :////
    this.dragStartEvent = e;

    const timeDiff = time - oldItem.time;
    const rowDiff = row - oldItem.row;

    let itemsToMove: Schedulable[];
    if (this.selected[i]) {
      itemsToMove = this.elements.filter((item, ind) => this.selected[ind]);
    } else {
      itemsToMove = [oldItem];
    }

    itemsToMove.forEach((item) => {
      item.time = item.time + timeDiff;
      item.row = item.row + rowDiff;
    });

    this.checkLoopEnd();
  }

  public remove(e: MouseEvent, i: number) {
    e.preventDefault();
    this.removeAtIndex(i);
  }

  public removeAtIndex(i: number) {
    const item = this.elements[i];
    item.remove(); // this removes it from the list
    this.$delete(this.selected, i);
  }

  public checkLoopEnd() {
    // Set the minimum to 1 measure!
    const maxTime = Math.max(
      ...this.elements.map((item) => item.time + item.duration),
      this.beatsPerMeasure,
    );

    const itemLoopEnd = Math.ceil(maxTime / this.beatsPerMeasure) * this.beatsPerMeasure;

    if (itemLoopEnd !== this.itemLoopEnd) {
      this.$update('sequencerLoopEnd', itemLoopEnd);
      this.itemLoopEnd = itemLoopEnd;
    }
  }

  public open(e: MouseEvent, i: number) {
    const item = this.elements[i];
    this.$emit('open', item);
  }

  public clickElement(i: number) {
    this.$update('prototype', this.elements[i]);
  }

  public select(e: MouseEvent, i: number) {
    const item = this.elements[i];
    if (!this.selected[i]) {
      this.elements.forEach((_, ind) => this.selected[ind] = false);
    }

    const createItem = (oldItem: Schedulable) => {
      const newItem = oldItem.copy();

      // We set selected to true because `newNew` will have a heigher z-index
      // Thus, it will be displayed on top (which we want)
      // Try copying selected files and you will notice the selected notes stay on top
      this.selected.push(true);
      this.sequence.push(newItem);
    };

    let targetIndex = i;
    if (this.holdingShift) {
      let selected: Schedulable[];

      // If selected, copy all selected. If not, just copy the item that was clicked.
      if (this.selected[i]) {
        // selected is all all selected except the element you pressed on
        selected = this.elements.filter((el, ind) => {
          if (this.selected[ind]) {
            // See in `createItem` that we are setting all new elements to selected
            // And accordingly we are setting selected to false here
            this.selected[ind] = false;
            return el !== item;
          } else {
            return false;
          }
        });
        // A copy of `item` will be created at this index
        // See the next line
        targetIndex = this.elements.length;
        createItem(item);
      } else {
        selected = [item];
      }

      selected.forEach(createItem);
    }

    this.dragStartEvent = e;

    document.documentElement.style.cursor = 'move';
    const disposer = addEventListeners({
      mousemove: (event) => this.move(event, targetIndex),
      mouseup: () => {
        document.documentElement.style.cursor = 'auto';
        disposer.dispose();
      },
    });
  }

  public afterMove() {
    this.dragStartEvent = null;
  }

  public keydown(e: KeyboardEvent) {
    if (e.keyCode === Keys.SHIFT) {
      this.holdingShift = true;
    } else if (e.keyCode === Keys.DELETE || e.keyCode === Keys.BACKSPACE) {
      // Slice and reverse sItemince we will be deleting from the array as we go
      let i = this.elements.length - 1;
      for (const item of reverse(this.elements)) {
        if (this.selected[i]) {
          this.removeAtIndex(i);
        }
        i--;
      }
    }
  }

  public keyup(e: KeyboardEvent) {
    if (e.keyCode === Keys.SHIFT) { this.holdingShift = false; }
  }

  public handleDrop(prototype: Schedulable, event: MouseEvent) {
    this.$update('prototype', prototype);
    this.$nextTick(() => this.add(event));
    this.$emit('new-prototype', prototype);
    // prototype is not updated automatically
  }

  @Watch<SequencerGrid>('elements', { immediate: true })
  public resetSelectedIfNecessary() {
    // Whenever the parent changes the items
    // we should reset the selected!
    // Also, since we are watching `value`, we modify `selected` first so that
    // this method doesn't trigger before `selected` is also changed.
    if (this.selected.length !== this.elements.length) {
      this.selected = this.elements.map((_) => false);
    }
    this.checkLoopEnd();
  }

  @Watch<SequencerGrid>('displayBeats', { immediate: true })
  public updateDisplayLoopEnd() {
    this.$update('displayLoopEnd', this.displayBeats);
  }
}
</script>

<style scoped lang="sass">
.sequencer
  width: 100%
  background: #303030
  display: inline-block
  position: relative

.measure, .section
  display: flex

.rows
  display: flex
  flex-direction: column
  position: absolute

.lines
  height: 100%
  z-index: 1 
  position: relative
  pointer-events: none

.sequencer-child
  position: relative

.progress-bar
  width: 1px
  background-color: #ffa
  box-shadow: -1px 0 2px #ffa

.loop-background
  opacity: 0
  background-color: #000
  transition: .2s opacity
  opacity: 0.2
  position: absolute

.loop-background, .progress-bar
  z-index: 2
  top: 0
  bottom: 0
  pointer-events: none

.loop-background--left
  left: 0
</style>
