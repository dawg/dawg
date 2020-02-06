<template>
  <svg ref="svg" class="overflow-visible">
    <rect 
      :height="height" 
      :width="width" 
      fill="currentColor"
      class="fg-default"
    ></rect>
    <rect 
      :height="leftHeight" 
      :y="getPosition(leftHeight)" 
      :width="width"
      fill="currentColor"
      class="fg-primary"
    ></rect>
    <rect 
      :height="height" 
      :width="width"
      fill="currentColor"
      class="fg-default"
      :style="style"
    ></rect>
    <rect
      :height="rightHeight"
      :y="getPosition(rightHeight)"
      :width="width"
      fill="currentColor"
      class="fg-primary"
      :style="style"
    ></rect>
    <drag-element
      tag="polygon"
      cursor="pointer"
      @contextmenu="contextmenu"
      @mouseenter="update"
      @mouseleave="afterMove"
      @move="move"
      :points="points" 
      fill="currentColor"
      class="fg-primary"
    ></drag-element>
  </svg>
</template>

<script lang="ts">
import { DragElement } from '@/draggable';
import { scale } from '@/utils';
import * as framework from '@/framework';
import { computed, createComponent, ref } from '@vue/composition-api';
import * as dawg from '@/dawg';

export default createComponent({
  name: 'Slider',
  components: { DragElement },
  props: {
    height: { type: Number, default: 150 },
    width: { type: Number, default: 6 },
    right: { type: Number, required: true },
    left: { type: Number, required: true },
    value: { type: Number, required: true },
    max: { type: Number, default: 1 },
    min: { type: Number, default: 0 },
  },
  setup(props, context) {
    const points = computed(() => {
      const width = 8;
      const height = 16;

      const left = (2 * props.width) + 6;
      const right = left + width;

      const p1 = { x: left, y: position.value };
      const p2 = { x: right, y: position.value - (height / 2) };
      const p3 = { x: right, y: position.value + (height / 2) };

      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
    });

    const scaled = computed(() => {
      return scale(props.value, [props.min, props.max], [0, 1]);
    });

    const position = computed(() => {
      return props.height - (props.height * scaled.value);
    });

    const rightHeight = computed(() => {
      return props.right * props.height;
    });

    const leftHeight = computed(() => {
      return props.left * props.height;
    });

    const svg = ref<SVGElement>(null);
    function move(e: MouseEvent) {
      if (!svg.value) {
        return;
      }
      let volume = svg.value.getBoundingClientRect().top + props.height - e.clientY;
      volume /= props.height;
      volume = Math.max(Math.min(volume, 1), 0);
      volume = scale(volume, [0, 1], [props.min, props.max]);
      context.emit('input', volume);
      update();
    }

    function getFormatted() {
      return Math.round(props.value * 100) + '%';
    }

    function update() {
      dawg.status.set({
        text: 'Volume',
        value: getFormatted(),
      });
    }

    function afterMove() {
      dawg.status.set(null);
    }

    function getPosition(level: number) {
      return props.height - level;
    }

    function contextmenu(event: MouseEvent) {
      framework.context({
        position: event,
        items: [
          {
            text: 'Create Automation Clip',
            callback: () => context.emit('automate'),
          },
        ],
      });
    }

    return {
      contextmenu,
      getPosition,
      update,
      afterMove,
      move,
      style: computed(() => ({ x: `${props.width + 2}px` })),
      points,
      leftHeight,
      rightHeight,
      svg,
    };
  },
});
</script>
