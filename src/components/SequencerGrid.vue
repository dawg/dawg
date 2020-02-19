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
        :colored="true"
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
        :show-border="el.showBorder"
        :text="el.name ? el.name.value : undefined"
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
import { UnscheduledPrototype, SchedulableTemp } from '@/models/schedulable';

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
  @Prop(Nullable(Function)) public prototype!: (() => SchedulableTemp<any, any>) | null;

  @Prop({ type: Number, required: true }) public displayLoopEnd!: number;

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
    // window.addEventListener('keydown', this.keydown);
    // window.addEventListener('keyup', this.keyup);
  }

  public destroyed() {
    // window.removeEventListener('keydown', this.keydown);
    // window.removeEventListener('keyup', this.keyup);
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
    //
  }

  public updateDuration(i: number, value: number) {
    //
  }

  public mouseDownOnSurroundings(e: MouseEvent) {
    //
  }

  public add(e: MouseEvent) {
    //
  }

  public move(e: MouseEvent, i: number) {
    //
  }

  public remove(e: MouseEvent, i: number) {
    e.preventDefault();
    this.removeAtIndex(i);
  }

  public removeAtIndex(i: number) {
    const item = this.elements[i];
    //
  }

  public checkLoopEnd() {
    //
  }

  public open(e: MouseEvent, i: number) {
    const item = this.elements[i];
    this.$emit('open', item);
  }

  public clickElement(i: number) {
    this.$update('prototype', this.elements[i].copy);
  }

  public select(e: MouseEvent, i: number) {
    //
  }

  public handleDrop(prototype: UnscheduledPrototype, e: MouseEvent) {
    const element = prototype(this.transport);
    // this.addHelper(e, element);

    this.$update('prototype', element.copy);
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
