<template>
  <div ref="el" class="relative" :class="{ flex: direction, 'flex-col': direction === 'vertical' }">
    <drag-element 
      class="absolute gutter"
      v-if="gutter"
      :style="gutterStyle"
      :cursor="cursor"
      @move="move"
    ></drag-element>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { watch, Ref, ref, createComponent, computed, onMounted, onUnmounted } from '@vue/composition-api';
import { update } from '@/lib/vutils';
import { Direction, Section, isSplit } from '@/lib/split/helper';

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
     * Whether the Section is collapsed.
     */
    collapsed: { type: Boolean, default: false },

    /**
     * Irrelevant for root nodes.
     */
    fixed: { type: Boolean, default: false },
    collapsible: { type: Boolean, default: false },
    minSize: { type: Number, default: 10 },
    gutterSize: { type: Number, default: 6 },
    collapsePixels: { type: Number, default: 10 },
  },
  setup(props, context) {
    const el = ref<HTMLElement>();

    const i = new Section({
      direction: props.direction,
      minSize: props.minSize,
      collapsePixels: props.collapsePixels,
      collapsible: props.collapsible,
      mode: props.keep ? 'low' : props.fixed ? 'fixed' : 'high',
      initial: props.initial,
      name: props.name,
      collapsed: props.collapsed,
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

    watch(() => props.collapsed, () => {
      if (props.collapsed) {
        i.collapse();
      } else {
        i.unCollapse(props.initial || 0);
      }
    }, { lazy: true });

    const isRoot = !isSplit(context.parent);
    let disposer: { dispose: () => void } | undefined;
    onMounted(() => {
      disposer = i.addListeners({
        height: (height) => {
          if (el.value) {
            el.value.style.height = height + 'px';
            el.value.style.minHeight = height + 'px';
          }
        },
        width: (width) => {
          if (el.value) {
            el.value.style.width = width + 'px';
            el.value.style.minWidth = width + 'px';
          }
        },
        resize: (size) => {
          update(props, context, 'initial', size);
        },
        collapsed: (value) => {
          update(props, context, 'collapsed', value);
        },
      });

      if (!isRoot) { return; }
      i.init({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    });

    onUnmounted(() => {
      if (disposer) { disposer.dispose(); }
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
      i.move(px);
    }

    const gutter = computed(() => {
      return i.isGutter;
    });

    return {
      i, // we HAVE to return i here so children can access it
      el,
      move,
      cursor,
      gutterStyle,
      gutter,
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
