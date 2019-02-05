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
    <div :style="sequencerStyle" class="layer lines" ref="beatLines"></div>
    <component
      v-for="(component, i) in components"
      :is="component.name"
      :left="component.left"
      :top="component.top"
      :row="component.row"
      :height="rowHeight"
      style="position: absolute; z-index: 2"
      :key="i"
      :element="component.element"
      :selected="selected[i]"
      :duration="component.duration"
      @update:duration="updateDuration(i, $event)"
      @contextmenu.native="remove($event, i)"
      @mousedown.native="select($event, i)"
      @click="clickElement(i)"
      @dblclick="open($event, i)"
    ></component>
    <progression
      :loop-start="loopStart"
      :loop-end="loopEnd"
      :progress="progress"
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
import { Draggable } from '@/modules/draggable';
import { FactoryDictionary } from 'typescript-collections';
import { range, Nullable, Keys } from '@/utils';
import BeatLines from '@/modules/sequencer/BeatLines';
import Progression from '@/modules/sequencer/Progression.vue';
import { Watch } from '@/modules/update';
import { IElement, Element } from '@/schemas';


@Component({
  components: { Progression },
})
export default class Arranger extends Mixins(Draggable, BeatLines) {
  @Inject() public stepsPerBeat!: number;

  @Prop({ type: String, required: true }) public name!: string;
  @Prop({ type: Number, required: true }) public rowHeight!: number;
  @Prop({ type: Array, required: true }) public elements!: Element[];
  @Prop({ type: Number, default: 0.25 }) public snap!: number;

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

  // TODO edge case -> what happens if the element is deleted?
  @Prop(Nullable(Object)) public prototype!: Element | null;

  public cursor = 'move';
  public rows!: HTMLElement;
  public selectStartEvent: MouseEvent | null = null;
  public selectCurrentEvent: MouseEvent | null = null;
  public holdingShift = false;
  public minDisplayMeasures = 4;
  public itemLoopEnd: number | null = null;
  // selected[i] indicates whether elements[i] is selected
  public selected: boolean[] = [];

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
      this.minDisplayMeasures * this.beatsPerMeasure,
      this.itemLoopEnd || 0,
    ) * this.stepsPerBeat;
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
    this.components[i].duration = value;
    this.elements[i].duration = value;
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
    this.$log.debug(x, e.clientX, rect.left, time);

    const y = e.clientY - rect.top;
    const row = Math.floor(y / this.rowHeight);

    this.$log.info(`Adding to row -> ${row}, time -> ${time}`);
    const item = this.prototype.copy();
    item.row = row;
    item.time = time;

    this.selected.push(false);
    this.elements.push(item);
    this.$emit('added', item);
    this.checkLoopEnd();
  }

  public move(e: MouseEvent, i: number) {
    const rect = this.rows.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let time = x / this.pxPerBeat;
    time = Math.floor(time / this.snap) * this.snap;
    if (time < 0) { return; }

    const y = e.clientY - rect.top;
    const row = Math.floor(y / this.rowHeight);
    if (row < 0) { return; }

    const oldItem = this.elements[i];
    if (row === oldItem.row && time === oldItem.time) { return; }

    const timeDiff = time - oldItem.time;
    const rowDiff = row - oldItem.row;

    let itemsToMove: Array<[Element, number]>;
    if (this.selected[i]) {
      itemsToMove = this.elements.map((item, ind) => {
        return [item, ind] as [Element, number];
      }).filter(([item, ind]) => this.selected[i]);
    } else {
      itemsToMove = [[oldItem, i]];
    }

    itemsToMove.forEach(([item, ind]) => {
      const newTime = item.time + timeDiff;
      const newItem = item.copy();
      newItem.time = newTime;
      newItem.row = item.row + rowDiff;

      this.$put(this.elements, ind, newItem);
      this.$emit('removed', item, ind);
      this.$emit('added', newItem);
      this.checkLoopEnd();
    });
  }

  public remove(e: MouseEvent, i: number) {
    e.preventDefault();
    this.removeAtIndex(i);
  }

  public removeAtIndex(i: number) {
    const item = this.elements[i];
    this.$delete(this.selected, i);
    this.$delete(this.elements, i);
    this.$emit('removed', item, i);
    this.checkLoopEnd();
  }

  public checkLoopEnd() {
    let maxTime = Math.max(...this.elements.map((item) => item.time + item.duration), 0);

    // Add a tiny amount to max time so that ceil will push to next number
    // if maxTime is a whole number
    maxTime = maxTime + 0.0000001;
    const itemLoopEnd = Math.ceil(maxTime / this.beatsPerMeasure) * this.beatsPerMeasure;

    this.$log.info(`${this.name} -> sequencerLoopEnd -> ${itemLoopEnd}`);
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

    const createItem = (oldItem: Element) => {
      const newItem = oldItem.copy();

      // We do this because `newNew` will have a heigher z-index
      // Thus, it will be displayed on top (which we want)
      this.selected.push(false);
      this.elements.push(newItem);
      this.$emit('added', newItem);
    };

    let targetIndex = i;
    if (this.holdingShift) {
      let selected: Element[];

      // If selected, copy all selected. If not, just copy the item that was clicked.
      if (this.selected[i]) {
        selected = this.elements.filter((n, ind) => this.selected[ind] && n !== item);
        targetIndex = this.elements.length; // A copy of `item` will be created at this index
        createItem(item);
      } else {
        selected = [item];
      }

      selected.forEach(createItem);
    }
    this.addListeners(e, targetIndex);
  }

  public keydown(e: KeyboardEvent) {
    if (e.keyCode === Keys.SHIFT) {
      this.holdingShift = true;
    } else if (e.keyCode === Keys.DELETE || e.keyCode === Keys.BACKSPACE) {
      // Slice and reverse sItemince we will be deleting from the array as we go
      const lastIndex = this.elements.length - 1;
      this.elements.slice().reverse().forEach((item, i) => {
        if (this.selected[i]) {
          this.removeAtIndex(lastIndex - i);
        }
      });
    }
  }

  public keyup(e: KeyboardEvent) {
    if (e.keyCode === Keys.SHIFT) { this.holdingShift = false; }
  }

  public handleDrop(prototype: Element, event: MouseEvent) {
    this.$update('prototype', prototype);
    this.$nextTick(() => this.add(event));
    // prototype is not updated automatically
  }

  @Watch<Arranger>('elements', { immediate: true })
  public resetSelectedIfNecessary() {
    // Whenever the parent changes the items
    // we should reset the selected!
    // Also, since we are watching `value`, we modify `selected` first so that
    // this method doesn't trigger before `selected` is also changed.
    if (this.selected.length !== this.elements.length) {
      this.selected = this.elements.map((_) => false);
    }
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
