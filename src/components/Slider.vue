<template>
  <svg ref="svg">
    <rect 
      :height="height" 
      :width="width" 
      :class="bgClass"
    ></rect>
    <rect 
      :height="leftHeight" 
      :y="getPosition(leftHeight)" 
      :width="width"
      class="primary--fill"
    ></rect>
    <rect 
      :height="height" 
      :width="width"
      :class="bgClass"
      :style="style"
    ></rect>
    <rect
      :height="rightHeight"
      :y="getPosition(rightHeight)"
      :width="width"
      class="primary--fill"
      :style="style"
    ></rect>
    <polygon 
      :points="points" 
      class="level primary--fill" 
      :ref="dragRef"
    ></polygon>
  </svg>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator';
import { Draggable } from '@/mixins';

@Component
export default class Slider extends Mixins(Draggable) {
  @Prop({ type: Number, default: 150 }) public height!: number;
  @Prop({ type: Number, default: 6 }) public width!: number;
  @Prop({ type: Number, required: true }) public right!: number;
  @Prop({ type: Number, required: true }) public left!: number;
  @Prop({ type: Number, required: true }) public value!: number;
  public style = { x: `${this.width + 2}px` };
  public bgClass = 'secondary--fill';
  public fg = '#3cb7d8';
  public cursor = 'pointer';

  public $refs!: {
    drag: HTMLElement,
    svg: HTMLElement,
  };

  get points() {
    const width = 8;
    const height = 16;

    const left = (2 * this.width) + 6;
    const right = left + width;

    return `${left},${this.position} ${right},${this.position - (height / 2)} ${right},${this.position + (height / 2)}`;
  }
  get position() {
    return this.height - (this.height * this.value);
  }
  get rightHeight() {
    return this.right * this.height;
  }
  get leftHeight() {
    return this.left * this.height;
  }

  public move(e: MouseEvent) {
    let volume = ((this.$refs.svg.clientTop + this.height) - e.offsetY);
    volume *= this.height;
    volume = Math.max(Math.min(volume, 1), 0);
    this.$emit('input', volume);
  }

  public getPosition(level: number) {
    return this.height - level;
  }
}
</script>

<style scoped lang="sass">
svg
  overflow: visible!important
</style>
