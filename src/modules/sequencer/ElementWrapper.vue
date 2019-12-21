<template>
  <div class="absolute z-10" :style="wrapperStyle">
    <div
      v-if="colored"
      class="relative inline-block overflow-hidden flex flex-col"
      :style="elementWrapperStyle"
    >
      <div class="w-full" style="height: 8px" :style="{ backgroundColor: color }"></div>
      <slot></slot>
    </div>
    <div
      v-else
      class="relative inline-block overflow-hidden"
      :style="elementWrapperStyle"
    >
      <slot v-bind:width="width"></slot>
    </div>
    <drag-element
      v-if="resizable"
      :style="style"
      :within="hover"
      curse="ew-resize"
      @move="move"
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
    pxPerBeat: { type: Number, required: true },
    height: { type: Number, required: true },
    duration: { type: Number, required: true },
    hoverClass: { type: String, required: false },
    hoverColor: { type: String, required: false },
    dragAreaWidth: { type: Number, default: 8 },
    left: { type: Number, required: true },
    top: { type: Number, required: true },
    selected: { type: Boolean, required: true },
    colored: { type: Boolean, required: true },
    resizable: { type: Boolean, required: true },
    color: { type: String, default: '#ccc' },
  },
  setup(props, context) {
    const hover = ref(false);

    const lightColor = computed(() => {
      const color = tinycolor(props.color).lighten(15).setAlpha(.1).toRgbString();
      return `${color}`;
    });

    const style = computed(() => {
      const style: { [k: string]: string | number } = {
        width: `${props.dragAreaWidth}px`,
        position: 'absolute',
        right: 0,
        top: 0,
        height: `${props.height}px`,
      };

      if (hover.value && props.hoverClass) {
        style.backgroundColor = props.hoverClass;
      }

      return style;
    });

    const width = computed(() => {
      return Math.max(props.duration * props.pxPerBeat, 2);
    });

    const componentStyle = computed(() => {
      return {
        height: `${props.height}px`,
      };
    })

    function move(e: MouseEvent) {
      if (!context.parent) { return; }
      const diff = (e.clientX - props.left) - context.parent.$el.getBoundingClientRect().left;
      let length = diff / props.pxPerBeat;
      length = Math.round(length / props.snap) * props.snap;
      if (props.duration === length) { return; }
      if (length < props.snap) { return; }
      update(props, context, 'duration', length);
    }

    return {
      hover,
      move,
      style,
      wrapperStyle: computed(() => ({ left: `${props.left}px`, top: `${props.top}px` })),
      elementWrapperStyle: computed(() => ({ 
        width: `${width.value}px`,
        height: `${props.height}px`,
        backgroundColor: props.selected ? '#ff9999!important' : props.colored ? lightColor.value : '',
      })),
      width,
    }
  }
})
</script>

<style lang="sass" scoped>

</style>