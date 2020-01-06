<template>
  <div @wheel="wheel" @mousemove="setAnchor">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Nullable, clamp } from '@/utils';

/**
 * This class enables scrolling using the wheel and manages "steady" zoom logic.
 */
@Component
export default class Scroller extends Vue {
  @Prop({ type: String, required: true }) public direction!: 'horizontal' | 'vertical';
  @Prop({ type: Number, required: true }) public increment!: number;
  @Prop(Nullable(Object)) public scroller!: Element | null;

  // The anchor is used to steady resizing
  // Try resizing the width/height and you will notice that that the position
  // under the mouse stays fixed. The anchor is what enables this to occur.
  // It will contains a floating point number where the integer part represents
  // the row/column and the floating point represens the exact location within
  // the next/row column.
  public anchor = 0;

  get scrollAttr() {
    return this.direction === 'horizontal' ? 'scrollLeft' : 'scrollTop';
  }

  get mouseAttr() {
    return this.direction === 'horizontal' ? 'pageX' : 'pageY';
  }

  get rectAttr() {
    return this.direction === 'horizontal' ? 'left' : 'top';
  }

  public setAnchor(e: MouseEvent) {
    if (!this.scroller) {
      return;
    }

    const rect = this.scroller.getBoundingClientRect();
    this.anchor = (e[this.mouseAttr] - rect[this.rectAttr] + this.scroller[this.scrollAttr]) / this.increment;
  }

  public wheel(e: WheelEvent) {
    if (!this.scroller) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (!e.ctrlKey) {
      if (this.direction === 'horizontal' && !e.shiftKey) {
        return;
      }

      // Here we are simulating scrolling since scrolling is not supported
      // on the timeline by default
      this.scroller[this.scrollAttr] += e.deltaY;
      this.$emit('scroll');

      // When we scroll using the wheel, we want to update the position of the anchor
      // Since the scroll hasn't actually happened, we need to account for the scrolling
      // that will occur.
      this.setAnchor(e);
    } else {
      const increment = this.calculateScrollPosition(e);
      this.$update('increment', increment);
    }
  }

  public calculateScrollPosition(e: WheelEvent) {
    if (!this.scroller) {
      return this.increment;
    }

    const rect = this.scroller.getBoundingClientRect();

    let oldPosition = e[this.mouseAttr] - rect[this.rectAttr];

    // Adding scroll to position to get accurate posotion.
    // The position will now be equal the distance from the top/left
    // of the element (accounting for scrolling) to the mouse position.
    oldPosition += this.scroller[this.scrollAttr];

    const delta = e.deltaY > 0 ? -0.5 : 0.5;
    const newSize = clamp(this.increment + delta, 3, 80);

    const rowOrCol = Math.floor(this.anchor);
    const extraPx = (this.anchor - rowOrCol) * newSize;
    const newPosition = newSize * rowOrCol + extraPx;

    // Get the diff between the desired position and the actual position
    // then add that to the scroll position
    const diff = newPosition - oldPosition;
    this.scroller[this.scrollAttr] = Math.max(this.scroller[this.scrollAttr] + diff, 0);
    return newSize;
  }
}
</script>