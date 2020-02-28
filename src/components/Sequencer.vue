<template>
  <div class="flex flex-col">
    <div class="flex" style="flex: 0 0 25px">
      <div 
        class="bg-default h-full flex items-center border-default-darken-1" 
        :style="style"
        :class="{ 'border-r': sideBorder }"
      >
        <dg-fa-icon
          class="cursor-pointer ml-1 text-xs"
          :class="tool === 'pointer' ? 'text-default-darken-2' : 'text-default-darken-5'"
          icon="hand-pointer"
          @click="selectTool('pointer')"
          title="Pointer Tool"
        ></dg-fa-icon>
        <dg-fa-icon
          class="cursor-pointer ml-2 text-xs"
          :class="tool === 'slicer' ? 'text-default-darken-2' : 'text-default-darken-5'"
          icon="hand-scissors"
          @click="selectTool('slicer')"
          title="Slicer Tool"
        ></dg-fa-icon>
        <div class="flex-grow"></div>
        <div 
          class="cursor-pointer pr-1 text-sm text-default-darken-3 tracking-tight"
          @click="cycleSnap"
          title="Measured in steps"
        >
          {{ snap.display }}
        </div>
        <dg-fa-icon
          class="cursor-pointer mr-2 text-default-darken-3 text-xs"
          icon="magnet"
          @click="cycleSnap"
          title="Measured in steps"
        ></dg-fa-icon>
      </div>
      <scroller
        :scroller="scrollX"
        class="w-full h-full"
        :increment="pxPerStep"
        direction="horizontal"
        @update:increment="setPxPerBeat"
        @scroll="onScrollX"
      >
        <timeline 
          :cursor-position="data.cursorPosition" 
          class="w-full h-full"
          :set-loop-end.sync="data.userLoopEnd"
          :set-loop-start.sync="data.userLoopStart"
          :loop-start="loopStart"
          :loop-end="loopEnd"
          :scroll-left="data.scrollLeft"
          :steps-per-beat="stepsPerBeat"
          :beats-per-measure="beatsPerMeasure"
          :px-per-beat.sync="pxPerBeat"
          :snap="snap.raw"
          :min-snap="minSnap"
          @seek="seek"
        ></timeline>
      </scroller>
    </div>
    <div
      class="flex scroller overflow-y-scroll"
      ref="scrollY"
      @scroll="onScrollY"
    >
      <!-- Use a wrapper div to add width attribute -->
      <scroller 
        :style="style" 
        class="side-wrapper border-default-darken-1"
        :class="{ 'border-r': sideBorder }"
        direction="vertical"
        :scroller="scrollY"
        :increment="rowHeight"
        @update:increment="setRowHeight"
        @scroll="onScrollY"
      >
        <slot 
          name="side"
        ></slot>
      </scroller>
      <sequencer-grid
        class="sequencer scroller overflow-x-scroll" 
        @scroll.native="onScrollX"
        ref="scrollXVue"
        :sequencer-loop-end.sync="data.sequencerLoopEnd"
        :loop-start="loopStart"
        :loop-end="loopEnd"
        :set-loop-start="data.userLoopStart"
        :set-loop-end="data.userLoopEnd"
        :steps-per-beat="stepsPerBeat"
        :beats-per-measure="beatsPerMeasure"
        :px-per-beat="pxPerBeat"
        :get-position="getPosition"
        :row-height="rowHeight"
        :cursor-position="data.cursorPosition"
        :name="name"
        :transport="transport"
        :tool="tool"
        :scroll-left="data.scrollLeft"
        :scroll-top="data.scrollTop"
        :snap="snap.raw"
        :min-snap="minSnap"
        :display-loop-end.sync="data.displayLoopEnd"
        v-bind="$attrs"
        v-on="listeners"
      ></sequencer-grid>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Keys, literal } from '@/lib/std';
import { update } from '@/lib/vutils';
import * as Audio from '@/lib/audio';
import { SequencerTool } from '@/grid';
import { createComponent, reactive, computed, watch, onMounted, ref, Ref } from '@vue/composition-api';

export default createComponent({
  name: 'Sequencer',
  props: {
    stepsPerBeat: { type: Number, required: true },
    beatsPerMeasure: { type: Number, required: true },
    rowHeight: { type: Number, required: true },
    pxPerBeat: { type: Number, required: true },
    name: { type: String, required: true },
    sideWidth: { type: Number, default: 80 },
    sideBorder: { type: Boolean, default: false },
    play: { type: Boolean, default: false },
    transport: { type: Object as () => Audio.Transport, required: true },
    isRecording: { type: Boolean, default: false },

    /**
     * Set this if you want to control the end of the loop. This will be ignored if set to 0.
     */
    setLoopEnd: { type: Number, required: false },

    /**
     * This will be synced with the end of the end of the loop.
     */
    end: { type: Number, required: false },

    /**
     * This will be synced with the start of the loop.
     */
    start: { type: Number, required: false },

    /**
     * The currently selected tool!
     */
    tool: { type: String as () => SequencerTool, default: literal('pointer') },
  },
  setup(props, context) {
    const data = reactive({
      scrollLeft: 0,
      scrollTop: 0,
      cursorPosition: 0,
      sequencerLoopEnd: 0,
      displayLoopEnd: 0,

      // The loop start/end set by the user using the timeline.
      userLoopStart: null as null | number,
      userLoopEnd: null as null | number,
      selectedSnap: 0,
    });

    const scrollXVue = ref<Vue>();
    const scrollY = ref<Element>(null);

    const scrollX = computed(() => {
      if (scrollXVue.value) {
        return scrollXVue.value.$el;
      } else {
        return null;
      }
    });

    const getPosition = () => {
      return {
        left: scrollX.value?.getBoundingClientRect().left ?? 0,
        top: scrollY.value?.getBoundingClientRect().top ?? 0,
      };
    };

    const minSnap = computed(() => {
      return 1 / props.stepsPerBeat / 24;
    });

    const snaps = computed(() => {
      return [
        { display: '1', raw: 1 / props.stepsPerBeat },
        { display: '1/2', raw: 1 / props.stepsPerBeat / 2 },
        { display: '1/4', raw: 1 / props.stepsPerBeat / 4 },
        { display: '1/6', raw: 1 / props.stepsPerBeat / 6 },
        { display: 'None', raw: minSnap.value },
      ];
    });

    const snap = computed(() => {
      return snaps.value[data.selectedSnap];
    });

    const style = computed(() => {
      return {
        minWidth: `${props.sideWidth}px`,
      };
    });

    const pxPerStep = computed(() => {
      return props.pxPerBeat / props.stepsPerBeat;
    });

    const loopEnd = computed(() => {
      // Prioritize the loop end set by the user
      // Then check if a specific loop end has been given
      // Then fallback to the calculated loop end

      if (data.userLoopEnd) {
        return data.userLoopEnd;
      }

      if (props.isRecording) {
        return data.displayLoopEnd;
      }

      if (props.setLoopEnd) {
        return props.setLoopEnd;
      }


      return data.sequencerLoopEnd;
    });

    const loopStart = computed(() => {
      return data.userLoopStart || 0;
    });

    function cycleSnap() {
      data.selectedSnap = (data.selectedSnap + 1) % snaps.value.length;
    }

    function seek(beat: number) {
      props.transport.beat = beat;
      doUpdate();
    }

    function doUpdate() {
      if (props.transport.state === 'started') { requestAnimationFrame(doUpdate); }
      data.cursorPosition = props.transport.beat;
    }

    function onScrollX() {
      if (scrollX.value) {
        data.scrollLeft = scrollX.value.scrollLeft;
      }
    }

    function onScrollY() {
      if (scrollY.value) {
        data.scrollTop = scrollY.value.scrollTop;
      }
    }

    function setPxPerBeat(newPxPerStep: number) {
      update(props, context, 'pxPerBeat', newPxPerStep * props.stepsPerBeat);
    }

    function setRowHeight(rowHeight: number) {
      update(props, context, 'rowHeight', rowHeight);
    }

    watch(loopEnd, () => {
      props.transport.loopEnd = loopEnd.value;
      update(props, context, 'end', loopEnd.value);
    });

    watch(loopStart, () => {
      props.transport.loopStart = loopStart.value;
      update(props, context, 'start', loopStart.value);
    });

    watch(() => props.transport, () => {
      data.userLoopStart = null;
      data.userLoopEnd = null;
    }, { lazy: true });

    watch(() => props.play, () => {
      if (props.play) {
        doUpdate();
      }
    });

    return {
      scrollXVue,
      scrollX,
      scrollY,
      onScrollY,
      setPxPerBeat,
      minSnap,
      snap,
      data,
      loopStart,
      loopEnd,
      style,
      cycleSnap,
      seek,
      onScrollX,
      setRowHeight,
      pxPerStep,
      listeners: context.listeners,
      selectTool: (tool: SequencerTool) => {
        update(props, context, 'tool', tool);
      },
      getPosition,
    };
  },
});
</script>

<style lang="scss" scoped>
.side-wrapper {
  height: fit-content
}

.scroller::-webkit-scrollbar {
  display: none;
}
</style>