<template>
  <drop 
    class="w-full relative flex flex-col"
    style="height: fit-content"
    group="arranger"
    ref="rows"
    @drop="handleDrop"
  >
    <div class="absolute" :style="selectStyle"></div>
    <div :style="sliceStyle"></div>
    <beat-lines
      class="absolute h-full pointer-events-none"
      :px-per-beat="pxPerBeat"
      :beats-per-measure="beatsPerMeasure"
      :steps-per-beat="stepsPerBeat"
      :style="sequencerStyle"
    ></beat-lines>

    <div class="ghost-elements">
      <element-wrapper
        v-for="(ghost, i) in ghostsComponents"
        :key="i"
        :px-per-beat="pxPerBeat"
        :colored="colored"
        :selected="false"
        :offset="0"
        :height="rowHeight"
        :snap="snap"
        :resizable="false"
        :can-offset="false"
        :top="ghost.top"
        :time="ghost.time"
      >
        <template v-slot:default="{ width }">
          <component
            :is="ghost.name"
            :row="ghost.row"
            :px-per-beat="pxPerBeat"
            :width="width"
            :height="rowHeight"
            :ghost="ghost.ghost"
          ></component>
        </template>
      </element-wrapper>
    </div>
    
    <div class="elements">
      <element-wrapper
        v-for="(el, i) in elements"
        :key="i"
        :time="el.time.value"
        :row="el.row.value"
        :rowHeight="rowHeight"
        :px-per-beat="pxPerBeat"
        :resizable="true"
        :disable-offset="!el.offsettable"
        :snap="snap"
        :min-snap="minSnap"
        :selected="selected[i]"
        :duration="el.duration.value"
        :offset="el.offset.value"
        :colored="colored"
        @mousedown.native="select($event, i)"
        @contextmenu.native="remove($event, i)"
        @click.native="clickElement(i)"
        @dblclick.native="open($event, i)"
        @update:duration="updateDuration(i, $event)"
        @update:offset="updateOffset(i, $event)"
      >
        <template v-slot:default="{ width }">
          <component
            :is="el.component"
            :row="el.row.value"
            :px-per-beat="pxPerBeat"
            :width="width"
            :height="rowHeight"
            :element="el"
          ></component>
        </template>
      </element-wrapper>
    </div>

    <progression
      :loop-start="loopStart"
      :loop-end="loopEnd"
      :progress="progress"
      :px-per-beat="pxPerBeat"
      class="progress-bar z-20"
    ></progression>

    <div 
      class="loop-background loop-background--left" 
      :style="leftStyle"
    ></div>

    <div 
      class="loop-background loop-background--right" 
      :style="rightStyle"
    ></div>

    <div
      v-for="row in numRows" 
      :key="row"
      :row="row - 1"
      :total-beats="displayBeats"
      :style="actualRowStyle(row - 1)"
      :class="rowClass(row - 1)"
      @click="add"
      @mousedown="mouseDownOnSurroundings"
    ></div>

  </drop>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Inject, Vue } from 'vue-property-decorator';
import { Keys } from '@/lib/std';
import { range, reverse, XYPosition } from '@/lib/std';
import { addEventListeners } from '@/lib/events';
import { Nullable } from '@/lib/vutils';
import BeatLines from '@/components/BeatLines';
import { Watch } from '@/lib/update';
import { Sequence } from '@/models';
import * as Audio from '@/lib/audio';
import { Ghost } from '@/models/ghost';
import { calculateSnap, calculateSimpleSnap, getIntersection, slice } from '@/utils';
import { UnscheduledPrototype, SchedulableTemp } from '../models/schedulable';

// For more information see the following link:
// https://stackoverflow.com/questions/4270485/drawing-lines-on-html-page
function lineStyle(
  { x1, y1, x2, y2 }: { x1: number, y1: number, x2: number, y2: number },
) {
    const a = x1 - x2;
    const b = y1 - y2;
    const c = Math.sqrt(a * a + b * b);

    const sx = (x1 + x2) / 2;
    const sy = (y1 + y2) / 2;

    const x = sx - c / 2;
    const y = sy;

    const alpha = Math.PI - Math.atan2(-b, a);
    return {
      border: '1px solid white',
      width: c + 'px',
      height: 0,
      transform: 'rotate(' + alpha + 'rad)',
      position: 'absolute',
      top: y + 'px',
      left: x + 'px',
    };
}


@Component({
  components: { BeatLines },
})
export default class SequencerGrid extends Vue {
  // name is used for debugging
  @Prop({ type: String, required: true }) public name!: string;
  @Prop({ type: Number, required: true }) public rowHeight!: number;
  @Prop({ type: Object, required: true }) public sequence!: Sequence<SchedulableTemp<any, any>>;
  @Prop({ type: Array, default: null }) public ghosts!: Ghost[] | null;
  @Prop({ type: Number, required: true }) public snap!: number;
  @Prop({ type: Number, required: true }) public minSnap!: number;
  @Prop({ type: String, required: true }) public tool!: 'slicer' | 'pointer';

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

  @Prop({ type: Object, required: true }) public transport!: Audio.Transport;

  // These values should only be set if there is a loop on the timeline
  @Prop(Nullable(Number)) public setLoopEnd!: number | null;
  @Prop(Nullable(Number)) public setLoopStart!: number | null;
  @Prop({ type: Number, required: true }) public progress!: number;

  // FIXME edge case -> what happens if the element is deleted?
  @Prop(Nullable(Object)) public prototype!: SchedulableTemp<any, any> | null;

  @Prop({ type: Number, required: true }) public displayLoopEnd!: number;

  @Prop({ type: Boolean, required: true }) public colored!: boolean;

  public rows!: HTMLElement;
  public selectStartEvent: MouseEvent | null = null;
  public selectCurrentEvent: MouseEvent | null = null;
  public sliceStyle: { [k: string]: string | number } | null = null;
  public dragStartEvent: MouseEvent | null = null;
  public holdingShift = false;
  public minDisplayMeasures = 4;
  public itemLoopEnd: number | null = null;
  // selected[i] indicates whether elements[i] is selected
  public selected: boolean[] = [];

  get elements() {
    return this.sequence.elements;
  }

  get ghostsComponents() {
    if (this.ghosts === null) {
      return [];
    }

    return this.ghosts.map((item) => {
      return {
        time: item.time,
        top: item.row * this.rowHeight,
        row: item.row,
        name: item.component,
        ghost: item,
      };
    });
  }

  get fullWidth() {
    return this.displayBeats * this.pxPerBeat;
  }

  get fullHeight() {
    return this.numRows * this.rowHeight;
  }

  get sequencerStyle() {
    return {
      width: `${this.fullWidth}px`,
      height: `${this.fullHeight}px`,
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
      if (minRow > item.row.value + 1 || item.row.value > maxRow) {
        this.selected[i] = false;
      } else if (minBeat > item.time.value + item.duration.value || item.time.value > maxBeat) {
        this.selected[i] = false;
      } else {
        this.selected[i] = true;
      }
    });

    return {
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
    this.rows = (this.$refs.rows as Vue).$el as HTMLElement;
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
      flex: `0 0 ${this.rowHeight}px`,
      width: `${this.pxPerBeat * this.displayBeats}px`,
    };
  }

  public updateOffset(i: number, value: number) {
    const item = this.elements[i];
    const diff = value - item.offset.value;

    const toUpdate = [i];
    if (this.selected[i]) {
      this.selected.forEach((selected, ind) => {
        if (selected && ind !== i) {
          toUpdate.push(ind);
        }
      });
    }

    // If the diff is less than zero, make sure we aren't setting the offset of
    // any of the elments to < 0
    if (diff < 0 && toUpdate.some((ind) => (this.elements[ind].offset.value + diff) < 0)) {
      return;
    }

    toUpdate.forEach((index) => {
      this.elements[index].offset.value += diff;
    });
  }

  public updateDuration(i: number, value: number) {
    const item = this.elements[i];
    const diff = value - item.duration.value;

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
    if (diff < 0 && toUpdate.some((ind) => this.elements[ind].duration.value + diff <= 0)) {
      return;
    }

    toUpdate.forEach((index) => {
      this.elements[index].duration.value += diff;
    });

    // Make sure to check the loop end when the duration of an element has been changed!!
    this.checkLoopEnd();
  }

  public mouseDownOnSurroundings(e: MouseEvent) {
    if (this.tool === 'pointer') {
      this.selectStartEvent = e;
      const disposer = addEventListeners({
        mousemove: (event: MouseEvent) => {
          this.selectCurrentEvent = event;
        },
        mouseup: () => {
          this.selectStartEvent = null;
          this.selectCurrentEvent = null;
          disposer.dispose();
        },
      });
    } else if (this.tool === 'slicer') {
      const rect = this.rows.getBoundingClientRect();

      const calculatePos = (event: MouseEvent) => {
        return {
            x: calculateSimpleSnap({
            value: event.clientX - rect.left,
            altKey: event.altKey,
            minSnap: this.minSnap,
            snap: this.snap,
            pxPerBeat: this.pxPerBeat,
          }),
          y: event.clientY - rect.top,
        };
      };

      const { x: x1, y: y1 } = calculatePos(e);
      const disposer = addEventListeners({
        mousemove: (event: MouseEvent) => {
          const { x: x2, y: y2 } = calculatePos(event);
          this.sliceStyle =  {
            zIndex: 3,
            ...lineStyle({ x1, y1, x2, y2 }),
          };
        },
        mouseup: (event) => {
          const { x: x2, y: y2 } = calculatePos(event);

          const toAdd: Array<SchedulableTemp<any, any>> = [];
          this.sequence.forEach((element) => {
            const result = slice({
              row: element.row.value,
              time: element.time.value,
              duration: element.duration.value,
              pxPerBeat: this.pxPerBeat,
              rowHeight: this.rowHeight,
              x1,
              y1,
              x2,
              y2,
            });

            if (result.result !== 'slice') {
              return;
            }

            const time = calculateSimpleSnap({
              value: result.time * this.pxPerBeat,
              altKey: event.altKey,
              minSnap: this.minSnap,
              snap: this.snap,
              pxPerBeat: this.pxPerBeat,
            }) / this.pxPerBeat;

            const newEl = element.slice(time);

            if (newEl) {
              toAdd.push(newEl);
            }
          });

          this.sequence.add(...toAdd);
          this.selected.push(...toAdd.map(() => false));
          this.sliceStyle = null;
          disposer.dispose();
        },
      });
    }
  }

  public addHelper(e: MouseEvent, el: SchedulableTemp<any, any>) {
    if (this.selected.some((selected) => selected)) {
      this.selected = this.elements.map(() => false);
      return;
    }

    const rect = this.$el.getBoundingClientRect();

    const x = e.clientX - rect.left;
    let time = x / this.pxPerBeat;
    time = Math.floor(time / this.snap) * this.snap;

    const y = e.clientY - rect.top;
    const row = Math.floor(y / this.rowHeight);

    el.row.value = row;
    el.time.value = time;

    this.selected.push(false);
    this.sequence.add(el);
  }

  public add(e: MouseEvent) {
    if (!this.prototype) {
      return;
    }

    this.addHelper(e, this.prototype.copy());
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
    const time = oldItem.time.value + diff;
    if (time < 0) { return; }

    const y = e.clientY - rect.top;
    const row = Math.floor(y / this.rowHeight);
    if (row < 0) { return; }

    if (row === oldItem.row.value && time === oldItem.time.value) { return; }
    // OK, so we've moved squares
    // Lets update our dragStartEvent or else
    // things will start to go haywyre :////
    this.dragStartEvent = e;

    const timeDiff = time - oldItem.time.value;
    const rowDiff = row - oldItem.row.value;

    let itemsToMove: Array<SchedulableTemp<any, any>>;
    if (this.selected[i]) {
      itemsToMove = this.elements.filter((item, ind) => this.selected[ind]);
    } else {
      itemsToMove = [oldItem];
    }

    if (itemsToMove.some((item) => (item.time.value + timeDiff) < 0)) {
      return;
    }

    itemsToMove.forEach((item) => {
      item.time.value = item.time.value + timeDiff;
      item.row.value = item.row.value + rowDiff;
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
      ...this.elements.map((item) => item.time.value + item.duration.value),
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

    const createItem = (oldItem: SchedulableTemp<any, any>) => {
      const newItem = oldItem.copy();

      // We set selected to true because `newNew` will have a heigher z-index
      // Thus, it will be displayed on top (which we want)
      // Try copying selected files and you will notice the selected notes stay on top
      this.selected.push(true);
      this.sequence.add(newItem);
    };

    let targetIndex = i;
    if (this.holdingShift) {
      let selected: Array<SchedulableTemp<any, any>>;

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
    if (e.keyCode === Keys.Shift) {
      this.holdingShift = true;
    } else if (e.keyCode === Keys.Delete || e.keyCode === Keys.Backspace) {
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
    if (e.keyCode === Keys.Shift) { this.holdingShift = false; }
  }

  public handleDrop(prototype: UnscheduledPrototype, e: MouseEvent) {
    const element = prototype(this.transport);
    this.addHelper(e, element);

    this.$update('prototype', element);
    this.$emit('new-prototype', element);
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
.progress-bar
  width: 1px
  background-color: #ffa
  box-shadow: -1px 0 2px #ffa

.loop-background
  background-color: #000
  transition: .2s opacity
  opacity: 0.2
  position: absolute

.loop-background, .progress-bar
  top: 0
  bottom: 0
  pointer-events: none

.loop-background--left
  left: 0
</style>
