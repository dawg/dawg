<template>
  <div @wheel="wheel" @mousemove="setAnchor">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import { Vue, Component, Prop } from 'vue-property-decorator';
import { clamp } from '@/lib/std';
import { Nullable, update } from '@/lib/vutils';
import { calculateScroll } from '@/utils';

// @Prop\((\{[ a-zA-Z:,]+\})\) public ([a-zA-Z]+)!: ([^\n]+)
// $2: $1,

/**
 * This class enables scrolling using the wheel and manages "steady" zoom logic.
 */
export default createComponent({
  name: 'Scroller',
  props: {
    direction: { type: String as () => 'horizontal' | 'vertical', required: true },
    increment: { type: Number, required: true },
    scroller: { type: Element, required: false },
  },
  setup(props, context) {
    // The anchor is used to steady resizing
    // Try resizing the width/height and you will notice that that the position
    // under the mouse stays fixed. The anchor is what enables this to occur.
    // It will contains a floating point number where the integer part represents
    // the row/column and the floating point represens the exact location within
    // the next/row column.
    let anchor = 0;

    const scrollAttr = computed(() => {
      return props.direction === 'horizontal' ? 'scrollLeft' : 'scrollTop';
    });

    const mouseAttr = computed(() => {
      return props.direction === 'horizontal' ? 'pageX' : 'pageY';
    });

    const rectAttr = computed(() => {
      return props.direction === 'horizontal' ? 'left' : 'top';
    });

    function setAnchor(e: MouseEvent) {
      if (!props.scroller) {
        return;
      }

      const rect = props.scroller.getBoundingClientRect();
      anchor = (e[mouseAttr.value] - rect[rectAttr.value] + props.scroller[scrollAttr.value]) / props.increment;
    }

    function wheel(e: WheelEvent) {
      if (!props.scroller) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // e.ctrlKey is automatically set to true when users use touchpad
      if (e.ctrlKey) {
        const rect = props.scroller.getBoundingClientRect();
        const { scroll, increment } = calculateScroll({
          elOffset: rect[rectAttr.value],
          mousePosition: e[mouseAttr.value],
          scrollOffset: props.scroller[scrollAttr.value],
          mouvement: e.deltaY,
          increment: props.increment,
          anchor,
        });

        props.scroller[scrollAttr.value] = scroll;
        // anchor = newAnchor;
        update(props, context, 'increment', increment);
      } else {
        if (props.direction === 'horizontal' && !e.shiftKey) {
          return;
        }

        // Here we are simulating scrolling since scrolling is not supported
        // on the timeline by default
        props.scroller[scrollAttr.value] += e.deltaY;
        context.emit('scroll');

        // When we scroll using the wheel, we want to update the position of the anchor
        // Since the scroll hasn't actually happened, we need to account for the scrolling
        // that will occur.
        setAnchor(e);
      }
    }

    return {
      wheel,
      setAnchor,
    };
  },
});
</script>