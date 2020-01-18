<template>
  <div class="absolute z-10" :style="wrapperStyle">
    <div
      v-if="colored"
      class="relative inline-block overflow-hidden flex flex-col"
      :style="elementWrapperStyle"
    >
      <div class="w-full" style="height: 8px" :style="{ backgroundColor: color }"></div>
      <slot v-bind:width="width" v-bind:offset="offset"></slot>
    </div>
    <div
      v-else
      class="relative inline-block overflow-hidden"
      :style="elementWrapperStyle"
    >
      <slot v-bind:width="width" v-bind:offset="offset"></slot>
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
import { createComponent, computed, ref } from '@vue/composition-api';
import { update } from '@/utils';
import tinycolor from 'tinycolor2';

export default createComponent({
  name: 'ElementWrapper',
  props: {
    snap: { type: Number, required: true },
    minSnap: { type: Number, required: true },
    pxPerBeat: { type: Number, required: true },
    height: { type: Number, required: true },
    /**
     * Duration in beats.
     */
    duration: { type: Number, required: true },
    offset: { type: Number, required: true },
    disableOffset: { type: Boolean, required: true },
    hoverClass: { type: String, required: false },
    hoverColor: { type: String, required: false },
    dragAreaWidth: { type: Number, default: 8 },
    time: { type: Number, required: true },
    top: { type: Number, required: true },
    selected: { type: Boolean, required: true },
    colored: { type: Boolean, required: true },
    resizable: { type: Boolean, required: true },
    color: { type: String, default: '#ccc' },
  },
  setup(props, context) {
    const lightColor = computed(() => {
      const color = tinycolor(props.color).lighten(15).setAlpha(.1).toRgbString();
      return `${color}`;
    });

    const style = (side: 'left' | 'right') => {
      const s: { [k: string]: string | number } = {
        width: `${props.dragAreaWidth}px`,
        position: 'absolute',
        top: 0,
        [side]: 0,
        height: `${props.height}px`,
      };

      // TODO
      // if (hover.value && props.hoverClass) {
      //   s.backgroundColor = props.hoverClass;
      // }

      return s;
    };

    const width = computed(() => {
      return Math.max((props.duration - props.offset) * props.pxPerBeat, 2);
    });

    const componentStyle = computed(() => {
      return {
        height: `${props.height}px`,
      };
    });

    const left = computed(() => {
      return (props.time + props.offset) * props.pxPerBeat;
    });

    const leftNoIncludeOffset = computed(() => {
      return props.time * props.pxPerBeat;
    });

    const moveHelper = (e: MouseEvent, opts: { canZero: boolean, prop: 'duration' | 'offset' }) => {
      if (!context.parent) { return; }

      const snap = e.altKey ? props.minSnap : props.snap;
      const remainder = props[opts.prop] % props.snap;
      const pxRemainder = remainder  * props.pxPerBeat;

      // The amount of pixels that the element is from the edge of the of grid
      const pxFromEdge = leftNoIncludeOffset.value - context.parent.$el.scrollLeft;

      // The amount of pixels that the mouse is from the edge of the of grid
      const pxMouse = e.clientX - context.parent.$el.getBoundingClientRect().left;

      const diff = pxMouse - pxFromEdge - pxRemainder;
      let newValue =  diff / props.pxPerBeat;
      newValue = (Math.round(newValue / snap) * snap) + remainder;
      newValue = Math.round(newValue / props.minSnap) * props.minSnap;

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

    return {
      moveRight,
      moveLeft,
      style,
      wrapperStyle: computed(() => ({
        left: `${left.value}px`,
        top: `${props.top}px`,
      })),
      elementWrapperStyle: computed(() => ({
        width: `${width.value}px`,
        height: `${props.height}px`,
        backgroundColor: props.selected ? '#ff999950!important' : props.colored ? lightColor.value : '',
      })),
      width,
    };
  },
});
</script>
