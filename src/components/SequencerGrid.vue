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
        v-for="(ghost, i) in (ghosts || [])"
        :key="i"
        :px-per-beat="pxPerBeat"
        :colored="true"
        :selected="false"
        :offset="0"
        :height="rowHeight"
        :snap="snap"
        :resizable="false"
        :can-offset="false"
        :time="ghost.time"
      >
        <template v-slot:default="{ width }">
          <component
            :is="ghost.component"
            :row="ghost.row"
            :px-per-beat="pxPerBeat"
            :width="width"
            :height="rowHeight"
            :ghost="ghost"
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
        @mousedown.native="mousedownElement($event, i)"
        @contextmenu.native="remove(i, $event)"
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
      :class="rowClass ? rowClass(row - 1) : ''"
      @mousedown="mousedownSurroundings"
    ></div>

  </drop>
</template>

<script lang="ts">
import Vue from 'vue';
import { range, reverse } from '@/lib/std';
import { addEventListeners } from '@/lib/events';
import { update } from '@/lib/vutils';
import BeatLines from '@/components/BeatLines';
import { Sequence } from '@/models';
import * as Audio from '@/lib/audio';
import { Ghost } from '@/models/ghost';
import { UnscheduledPrototype, SchedulableTemp, SchedulablePrototype } from '@/models/schedulable';
import { createComponent, ref, computed, watch, onUnmounted, onMounted } from '@vue/composition-api';
import { createGrid, SequencerTool } from './grid';

export default createComponent({
  components: { BeatLines },
  props: {
    name: { type: String as () => string, required: true },
    rowHeight: { type: Number, required: true },
    sequence: { type: Object as () => Sequence<SchedulableTemp<any, any>>, required: true },
    ghosts: { type: Array as () => Ghost[] | null, default: null },
    snap: { type: Number, required: true },
    minSnap: { type: Number, required: true },
    tool: { type: String as () => SequencerTool, required: true },
    pxPerBeat: { type: Number, required: true },
    beatsPerMeasure: { type: Number, required: true },
    stepsPerBeat: { type: Number, required: true },
    numRows: { type: Number, required: true },
    rowStyle: { type: Function as any as () => ((row: number) => object) },
    rowClass: { type: Function as any as () => ((row: number) => string) },

    // These are for the progression.
    loopEnd: { type: Number, required: true },
    loopStart: { type: Number, required: true },

    // The loop end determined by the items.
    sequencerLoopEnd: { type: Number, required: true },

    transport: { type: Object as () => Audio.Transport, required: true },
    progress: { type: Number, required: true },
    displayLoopEnd: { type: Number, required: true },

    // scroll stuff
    scrollLeft: { type: Number, required: true },
    scrollTop: { type: Number, required: true },

    // These values should only be set if there is a loop on the timeline
    setLoopEnd: Number,
    setLoopStart: Number,

    getPosition: { type: Function as any as () => (() => { left: number, top: number }), required: true },

    // FIXME edge case -> what happens if the element is deleted?
    prototype: { type: Object as () => SchedulablePrototype<any, any> },
  },
  setup(props, context) {
    const rows = ref<Vue>(null);

    const grid = createGrid({
      sequence: computed(() => props.sequence),
      pxPerBeat: computed(() => props.pxPerBeat),
      pxPerRow: computed(() => props.rowHeight),
      snap: computed(() => props.snap),
      minSnap: computed(() => props.minSnap),
      scrollLeft: computed(() => props.scrollLeft),
      scrollTop: computed(() => props.scrollTop),
      beatsPerMeasure: computed(() => props.beatsPerMeasure),
      createElement: computed(() => props.prototype),
      tool: computed(() => props.tool),
      getPosition: props.getPosition,
    });

    onMounted(grid.onMounted);
    onUnmounted(grid.onUnmounted);

    const { displayBeats, selected, sequencerLoopEnd } = grid;

    watch(sequencerLoopEnd, () => {
      update(props, context, 'sequencerLoopEnd', sequencerLoopEnd.value);
    });

    const elements = computed(() => {
      return props.sequence.elements;
    });

    const fullWidth = computed(() => {
      return displayBeats.value * props.pxPerBeat;
    });

    const fullHeight = computed(() => {
      return props.numRows * props.rowHeight;
    });

    const sequencerStyle = computed(() => {
      return {
        width: `${fullWidth.value}px`,
        height: `${fullHeight.value}px`,
      };
    });

    const leftStyle = computed(() => {
      if (props.setLoopStart) {
        return {
          width: `${props.setLoopStart * props.pxPerBeat}px`,
        };
      }
    });

    const rightStyle = computed(() => {
      if (props.setLoopEnd) {
        const left = props.setLoopEnd * props.pxPerBeat;
        return {
          left: `${left}px`,
          width: `${displayBeats.value * props.pxPerBeat - left}px`,
        };
      }
    });

    function actualRowStyle(i: number) {
      const style = props.rowStyle ? props.rowStyle(i) : {};
      return {
        ...style,
        flex: `0 0 ${props.rowHeight}px`,
        width: `${props.pxPerBeat * displayBeats.value}px`,
      };
    }

    function open(e: MouseEvent, i: number) {
      const item = elements.value[i];
      context.emit('open', item);
    }

    function clickElement(i: number) {
      update(props, context, 'prototype', elements.value[i]);
    }

    async function handleDrop(prototype: UnscheduledPrototype, e: MouseEvent) {
      const element = prototype(props.transport);
      update(props, context, 'prototype', element);
      await Vue.nextTick();
      grid.add(e);
      // TODO
      // context.emit('new-prototype', element);
    }

    watch(displayBeats, () => {
      update(props, context, 'displayLoopEnd', displayBeats.value);
    });

    return {
      rows,
      sequencerStyle,
      handleDrop,
      selectStyle: grid.selectStyle,
      sliceStyle: grid.sliceStyle,
      elements,
      mousedownElement: grid.select,
      remove: grid.remove,
      clickElement,
      open,
      updateDuration: grid.updateDuration,
      updateOffset: grid.updateOffset,
      selected,
      mousedownSurroundings: grid.mousedown,
      leftStyle,
      rightStyle,
      displayBeats,
      add: grid.add,
      actualRowStyle,
    };
  },
});
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
