<template>
  <div ref="el" class="relative" :class="{ flex: direction, 'flex-col': direction === 'vertical' }">
    <drag-element 
      class="absolute gutter"
      v-if="i.isGutter"
      :style="gutterStyle"
      :cursor="cursor"
      @move="move"
    ></drag-element>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { watch, Ref, ref, createComponent, computed, onMounted, onUnmounted } from '@vue/composition-api';
import { update } from '@/utils';
import { Direction, Split, isSplit } from '@/modules/split/helper';

export default createComponent({
  name: 'Split',
  props: {
    /**
     * Irrelevant for leaf nodes.
     */
    direction: String as () => Direction,
    initial: Number,


    /**
     * Useful for debugging.
     */
    name: { type: String, required: true },

    /**
     * Irrelevant for root nodes.
     */
    keep: { type: Boolean, default: false },

    /**
     * Irrelevant for root nodes.
     */
    fixed: { type: Boolean, default: false },
    collapsible: { type: Boolean, default: false },
    minSize: { type: Number, default: 10 },
    maxSize: { type: Number, default: Infinity },
    gutterSize: { type: Number, default: 6 },
    collapsePixels: { type: Number, default: 10 },
  },
  setup(props, context) {
    const el = ref<HTMLElement>();

    const i = new Split({
      direction: props.direction,
      minSize: ref(props.minSize),
      maxSize: ref(props.maxSize),
      collapsePixels: ref(props.collapsePixels),
      collapsible: ref(props.collapsible),
      keep: ref(props.keep),
      fixed: ref(props.fixed),
      initial: ref(props.initial),
      name: ref(props.name),
    });

    const parentDirection = computed(() => {
      if (i.parent) {
        return i.parent.direction;
      }
    });

    const gutterStyle = computed(() => {
      // The margin makes sure the gutter is centered on the line
      if (parentDirection.value === 'horizontal') {
        return {
          height: '100%',
          width: `${props.gutterSize}px`,
          marginLeft: `${-props.gutterSize / 2}px`,
        };
      } else {
        return {
          width: '100%',
          height: `${props.gutterSize}px`,
          marginTop: `${-props.gutterSize / 2}px`,
        };
      }
    });

    const cursor = computed(() => {
      if (parentDirection.value === 'horizontal') {
        return 'ew-resize';
      } else {
        return 'ns-resize';
      }
    });

    if (isSplit(context.parent)) {
      i.setParent(context.parent.i);
    }

    const isRoot = !isSplit(context.parent);
    onMounted(() => {
      // i.onDidHeightResize((height) => {
      //   if (el.value) {
      //     el.value.style.height = height + 'px';
      //   }
      // });

      // i.onDidWidthResize((width) => {
      //   if (el.value) {
      //     el.value.style.width = width + 'px';
      //   }
      // });

      // i.onDidChangeSize((size) => {
      //   update(props, context, 'initial', size);
      // });

      if (!isRoot) { return; }

      i.init({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    });

    onUnmounted(() => {
      if (!isRoot) { return; }
      i.dispose();
    });

    function move(e: MouseEvent) {
      if (parentDirection.value === undefined) {
        return;
      }

      if (!el.value) {
        return;
      }

      const { left, top } = el.value.getBoundingClientRect();
      const gutterPosition = parentDirection.value === 'horizontal' ? left : top;
      const mousePosition = parentDirection.value === 'horizontal' ? e.clientX : e.clientY;

      const px = mousePosition - gutterPosition;
      i.resize(px);
    }

    return {
      el,
      move,
      cursor,
      gutterStyle,
      i,
    };
  },
});
</script>

<style lang="scss" scoped>
.gutter {
  left: 0;
  top: 0;
  width: 100%;
  z-index: 999;
}
</style>
