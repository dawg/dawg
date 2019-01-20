<template>
  <div
    class="drag"
    :style="style"
    :class="resizeAreaClass"
    @mouseenter="onHover"
    @mouseleave="afterHover"
    @mousedown="addListeners"
  ></div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins, Inject } from 'vue-property-decorator';
import { Draggable } from '@/modules/draggable';

@Component
export default class Resizable extends Mixins(Draggable) {
  @Inject() public snap!: number;
  @Inject() public pxPerBeat!: number;

  @Prop({ type: Number, required: true }) public duration!: number;
  @Prop({ type: String, required: false }) public hoverClass?: string;
  @Prop({ type: String, required: false }) public hoverColor?: string;
  @Prop({ type: Number, default: 8 }) public dragAreaWidth!: number;

  public cursor = 'ew-resize';

  get style() {
    const style: { [k: string]: string } = {
      width: `${this.dragAreaWidth}px`,
    };

    if (this.in && this.hoverClass) {
      style.backgroundColor = this.hoverClass;
    }

    return style;
  }

  get resizeAreaClass() {
    if (this.in) {
      return this.hoverClass;
    }
  }

  public move(e: MouseEvent) {
    const diff = e.clientX - this.$parent.$el.getBoundingClientRect().left;
    let length = diff / this.pxPerBeat;
    length = Math.round(length / this.snap) * this.snap;
    if (this.duration === length) { return; }
    if (length < this.snap) { return; }
    this.$update('duration', length);
  }
}
</script>

<style lang="sass" scoped>
.drag
  position: absolute
  height: 100%
  right: 0
  top: 0
</style>