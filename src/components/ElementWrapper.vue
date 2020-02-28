<template>
  <div class="absolute z-10" :style="wrapperStyle">
    <div
      v-if="showBorder"
      class="relative inline-block overflow-hidden flex flex-col"
      :style="elementWrapperStyle"
    >
      <div class="w-full" :style="borderStyle"></div>
      <div class="w-full text-default select-none truncate" :style="textBorderStyle">
        {{ text }}
      </div>
      <div class="w-full" :style="spacerStyle"></div>
      <slot v-bind:width="width" v-bind:offset="offset"></slot>
    </div>
    <!-- TODO make sure looping still works! -->
    <div
      v-else
      class="relative inline-block overflow-hidden"
      :style="elementStyle"
    >
      <slot v-bind:width="width" v-bind:offset="offset" v-bind:color="backgroundColor"></slot>
    </div>
    <drag-element
      v-if="resizable && !disableOffset"
      :style="style('left')"
      cursor="ew-resize"
      @move="moveLeft"
    ></drag-element>
    <drag-element
      v-if="resizable"
      :style="style('right')"
      cursor="ew-resize"
      @move="moveRight"
    ></drag-element>
  </div>
</template>


<script lang="ts">
import { createComponent, computed, ref, watch } from '@vue/composition-api';
import { update } from '@/lib/vutils';
import tinycolor from 'tinycolor2';
import { calculateSnap } from '@/utils';

export default createComponent({
  name: 'ElementWrapper',
  props: {
    snap: { type: Number, required: true },
    minSnap: { type: Number, required: true },
    pxPerBeat: { type: Number, required: true },
    /**
     * Duration in beats.
     */
    duration: { type: Number, required: true },
    offset: { type: Number, required: true },
    disableOffset: { type: Boolean, required: true },
    dragAreaWidth: { type: Number, default: 8 },
    time: { type: Number, required: true },
    row: { type: Number, required: true },
    rowHeight: { type: Number, required: true },
    selected: { type: Boolean, required: true },
    showBorder: { type: Boolean, required: false },
    text: { type: String, required: false },
    resizable: { type: Boolean, required: true },
    color: { type: String, default: '#1976d29e' },
  },
  setup(props, context) {
    const lightColor = computed(() => {
      return `${tinycolor(props.color).lighten(15).setAlpha(.1).toRgbString()}`;
    });

    const style = (side: 'left' | 'right') => {
      const s: { [k: string]: string | number } = {
        width: `${props.dragAreaWidth}px`,
        position: 'absolute',
        top: 0,
        [side]: 0,
        height: `${props.rowHeight}px`,
      };

      return s;
    };

    const width = computed(() => {
      return Math.max((props.duration - props.offset) * props.pxPerBeat, 2);
    });

    const componentStyle = computed(() => {
      return {
        height: `${props.rowHeight}px`,
      };
    });

    const left = computed(() => {
      return (props.time + props.offset) * props.pxPerBeat;
    });

    const top = computed(() => {
      return (props.row) * props.rowHeight;
    });

    const leftNoIncludeOffset = computed(() => {
      return props.time * props.pxPerBeat;
    });

    const moveHelper = (e: MouseEvent, opts: { canZero: boolean, prop: 'duration' | 'offset' }) => {
      if (!context.parent) { return; }

      const newValue = calculateSnap({
        event: e,
        minSnap: props.minSnap,
        snap: props.snap,
        pxPerBeat: props.pxPerBeat,
        pxFromLeft: leftNoIncludeOffset.value,
        reference: context.parent.$el,
      });

      if (props[opts.prop] === newValue) { return; }

      if (opts.canZero) {
        if (newValue < 0) { return; }
      } else {
        if (newValue <= 0) { return; }
      }

      update(props, context, opts.prop, newValue);
    };

    function moveRight(e: MouseEvent) {
      moveHelper(e, { canZero: false, prop: 'duration' });
    }

    function moveLeft(e: MouseEvent) {
      moveHelper(e, { canZero: true, prop: 'offset' });
    }

    const backgroundColor = computed(() => {
      return props.selected ? '#ff999950!important' : props.showBorder ? lightColor.value : undefined;
    });

    return {
      moveRight,
      moveLeft,
      style,
      wrapperStyle: computed(() => ({
        left: `${left.value}px`,
        top: `${top.value}px`,
      })),
      backgroundColor,
      elementStyle: computed(() => ({
        width: `${width.value}px`,
        height: `${props.rowHeight}px`,
      })),
      elementWrapperStyle: computed(() => ({
        width: `${width.value}px`,
        height: `${props.rowHeight}px`,
        backgroundColor: backgroundColor.value,
      })),
      width,
      borderStyle: computed(() => {
        return {
          backgroundColor: props.color,
          height: `10px`,
          opacity: '0.60',
          position: 'absolute',
        };
      }),
      textBorderStyle: computed(() => {
        return {
          lineHeight: `10px`,
          fontSize: '9px',
          padding: '0 3px',
          position: 'absolute',
        };
      }),
      spacerStyle: computed(() => ({
        flex: `0 0 10px`,
      })),
    };
  },
});
</script>
