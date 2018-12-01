<template>
  <div class="rela-inline knob" :ref="dragRef">
    <div 
      class="rela-block knob-dial" 
      :style="knobStyle"
    >
      <svg class="dial-svg" viewBox="0 0 100 100">
        <path
          :d="rangePath"
          fill="none"
          stroke="#55595C"
          :stroke-width="strokeWidth"
        ></path>
        <path 
          :d="rangePath" 
          fill="none" 
          :stroke="primaryColor"
          :stroke-width="strokeWidth"
          :style="strokeStyle"
        ></path>
        <rect
          :width="rectWidth"
          :x="center - rectWidth / 2"
          :height="rectHeight"
          :fill="primaryColor"
          :transform="transform"
        ></rect>
      </svg>
    </div>
    <div
      v-if="label"
      class="rela-block knob-label" 
      style="color: #E4E8EA"
    >
      {{ label }}
    </div>
  </div>
</template>

<script lang="ts">
import { Draggable } from '@/mixins';
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator';

// TODO These should be computed

// Credit to the styling goes to this codepen: https://codepen.io/mavrK/pen/erQPvP
// They actually have some nice dials we may want to use

@Component
export default class Knob extends Mixins(Draggable) {
  @Prop({ type: Number }) public value!: number;
  @Prop({ type: Number, default: 264 }) public range!: number;
  @Prop({ type: Number, default: 100 }) public max!: number;
  @Prop({ type: Number, default: 0 }) public min!: number;
  @Prop({ type: Number, default: 1 }) public stepSize!: number;
  @Prop({ type: Number, default: 100 }) public size!: number;
  @Prop({ type: String, default: '#409eff' }) public primaryColor!: string;
  @Prop(String) public label?: string;
  @Prop({ type: Number, default: 2.5 }) public strokeWidth!: number;

  public rotation = -this.range / 2;
  public rectWidth = 3;
  public rectHeight = 25;

  get minDegrees() {
    return 90 + this.angle;
  }
  get maxDegrees() {
    return 90 - this.angle;
  }
  get maxRadians() {
    return this.maxDegrees / 360 * 2 * Math.PI;
  }
  get minRadians() {
    return this.minDegrees / 360 * 2 * Math.PI;
  }
  get minX() {
    return this.center + (Math.cos(this.minRadians) * this.radius);
  }
  get minY() {
    return this.center - (Math.sin(this.minRadians) * this.radius);
  }
  get maxX() {
    return this.center + (Math.cos(this.maxRadians) * this.radius);
  }
  get maxY() {
    return this.center - (Math.sin(this.maxRadians) * this.radius);
  }

  get angle() {
    return this.range / 2;
  }
  get transform() {
    return `rotate(${this.rotation} ${this.center} ${this.center})`;
  }
  get rangePath() {
    return `M ${this.minX} ${this.minY} A ${this.radius} ${this.radius} 0 1 1 ${this.maxX} ${this.maxY}`;
  }
  public get strokeDashoffset() {
    return 184 - (184 / 264) * (this.rotation + this.angle);
  }
  public get strokeStyle() {
    return { 'stroke-dashoffset': this.strokeDashoffset };
  }
  public get knobStyle() {
    return {
      color: this.primaryColor,
      height: `${this.size}px`,
      width: `${this.size}px`,
    };
  }
  public get center() {
    return this.size / 2;
  }
  public get radius() {
    // TODO add comment here
    return this.center - this.strokeWidth / 2;
  }

  public move(e: MouseEvent, { changeY }: { changeY: number }) {
    // Multiply by a factor to get better speed.
    // This factor should eventually be computed by the changeX
    this.rotation -= changeY * 1.5;
    this.rotation = Math.max(-132, Math.min(this.angle, this.rotation));
    const value = this.mapRange(this.rotation, -this.angle, this.angle, this.min, this.max);
    this.$emit('input', value);
  }

  public beforeMount() {
    this.rotation = this.mapRange(this.value, this.min, this.max, -this.angle, this.angle);
  }
}
</script>


<style scoped lang="sass">
.abs-center
  position: absolute
  top: 50%
  left: 50%
  transform: translate(-50%, -50%)

.rela-inline
  display: inline-block
  position: relative

.dial-grip
  border-radius: 100%
  z-index: 5
  height: 82px
  width: 82px

.dial-svg
  stroke-width: 2.5
  pointer-events: none
  stroke-dasharray: 184 184
    
.knob-label
  text-align: center
  font-family: monospace
  font-size: 16px

.rela-block 
  position: relative
</style>
