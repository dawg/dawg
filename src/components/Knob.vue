<template>
  <div class="rela-inline knob" :ref="dragRef">
    <div 
      class="rela-block knob-dial" 
      :style="knobStyle"
    >
      <svg class="dial-svg" :height="size" :width="size">
        <path
          :d="rangePath"
          fill="none"
          :class="strokeClass"
          :stroke="strokeColor"
          :stroke-width="strokeWidth"
        ></path>
        <path 
          v-show="showRight"
          :d="rightRangePath" 
          fill="none" 
          :stroke="primaryColor"
          :stroke-width="strokeWidth"
          :style="rightStrokeStyle"
        ></path>
        <path 
          v-show="showLeft"
          :d="leftRangePath"
          fill="none" 
          :stroke="primaryColor"
          :stroke-width="strokeWidth"
          :style="lefStrokeStyle"
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
      :style="labelStyle"
    >
      {{ label }}
    </div>
  </div>
</template>

<script lang="ts">
import { Draggable } from '@/modules/draggable';
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator';

// Credit to the styling goes to this codepen: https://codepen.io/mavrK/pen/erQPvP
// They actually have some nice dials we may want to use

// Some things to note:
// 1. Most things here use angles from the +x axis; however, svg rotation starts from the +y axis
// 2. The rotation of the knob is clockwise so the minimum variables are actually the larger values

@Component
export default class Knob extends Mixins(Draggable) {
  @Prop({ type: Number }) public value!: number;
  @Prop({ type: Number, default: 264 }) public range!: number;
  @Prop({ type: Number, default: 100 }) public max!: number;
  @Prop({ type: Number, default: 0 }) public min!: number;
  @Prop({ type: Number, default: 100 }) public size!: number;
  @Prop({ type: String, default: '#409eff' }) public primaryColor!: string;
  @Prop(String) public label?: string;
  @Prop({ type: Number, default: 2.5 }) public strokeWidth!: number;
  @Prop(Number) public midValue?: number;
  @Prop({ type: String, default: '#55595C' }) public strokeColor!: string;
  @Prop(String) public strokeClass?: string;

  public rotation = -this.range / 2;
  public rectWidth = 3;
  public rectHeight = this.size / 4;

  get midDegrees() {
    let midValue = this.midValue;
    if (midValue === undefined) { midValue = this.min; }
    return this.mapRange(midValue, this.min, this.max, this.minDegrees, this.maxDegrees);
  }
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
  get midRadians() {
    return this.midDegrees / 360 * 2 * Math.PI;
  }
  get minX() {
    return this.center + (Math.cos(this.minRadians) * this.r);
  }
  get minY() {
    return this.center - (Math.sin(this.minRadians) * this.r);
  }
  get maxX() {
    return this.center + (Math.cos(this.maxRadians) * this.r);
  }
  get maxY() {
    return this.center - (Math.sin(this.maxRadians) * this.r);
  }
  get midX() {
    return this.center + (Math.cos(this.midRadians) * this.r);
  }
  get midY() {
    return this.center - (Math.sin(this.midRadians) * this.r);
  }
  get angle() {
    return this.range / 2;
  }
  public get center() {
    return this.size / 2;
  }
  public get r() {
    // We have to take off half of the stroke width due to how svg arcs work.
    // If we were to tell an svg to create an arc with radius 10 and a stroke-width of 2
    // the actual radius would be 11 (measuring from outside the path).
    // However, we want to be more exact than that. If the size is 20, we want the size the be exactly 20
    return this.size / 2 - this.strokeWidth / 2;
  }

  get labelStyle() {
    const fontSize = `${Math.round(this.size / 3)}px`;
    return { fontSize };
  }

  // dial
  get transform() {
    return `rotate(${this.rotation} ${this.center} ${this.center})`;
  }
  public get knobStyle() {
    return {
      color: this.primaryColor,
      height: `${this.size}px`,
      width: `${this.size}px`,
    };
  }

  // background path
  get rangePath() {
    return `M ${this.minX} ${this.minY} A ${this.r} ${this.r} 0 1 1 ${this.maxX} ${this.maxY}`;
  }

  // left path
  get leftLarge() {
    return this.leftRange > 180 ? 1 : 0;
  }
  get leftRangePath() {
    return `M ${this.midX} ${this.midY} A ${this.r} ${this.r} 0 ${this.leftLarge} 0 ${this.minX} ${this.minY}`;
  }
  public get leftLength() {
    return (this.minRadians - this.midRadians) * this.r;
  }
  public get leftRange() {
    return this.minDegrees - this.midDegrees;
  }
  get leftAngleBetween() {
    const angle = 90 - this.rotation; // Converting to start from +x axis
    return angle - this.midDegrees;
  }
  get showLeft() {
    return this.leftAngleBetween > 0;
  }
  get lefStrokeStyle() {
    let offset = this.leftRange - this.leftAngleBetween;
    offset = (offset / this.leftRange) * this.leftLength;
    return {
      'stroke-dasharray': this.leftLength,
      'stroke-dashoffset': offset,
    };
  }

  // right path
  get rightLarge() {
    return this.rightRange > 180 ? 1 : 0;
  }
  get rightRangePath() {
    return `M ${this.midX} ${this.midY} A ${this.r} ${this.r} 0 ${this.rightLarge} 1 ${this.maxX} ${this.maxY}`;
  }
  public get rightLength() {
    return (this.midRadians - this.maxRadians) * this.r;
  }
  public get rightRange() {
    return this.midDegrees - this.maxDegrees;
  }
  public get rightAngleBetween() {
    const angle = 90 - this.rotation; // Converting to start from +x axis
    return this.midDegrees - angle;
  }
  public get showRight() {
    return this.rightAngleBetween > 0;
  }
  get rightStrokeStyle() {
    let offset = this.rightRange - this.rightAngleBetween;
    offset = (offset / this.rightRange) * this.rightLength;
    return {
      'stroke-dasharray': this.rightLength,
      'stroke-dashoffset': offset,
    };
  }



  public move(e: MouseEvent, { changeY }: { changeY: number }) {
    // Multiply by a factor to get better speed.
    // This factor should eventually be computed by the changeX
    // For example, as they move farther away from their inital x position, the factor decreases
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

.dial-svg
  pointer-events: none
    
.knob-label
  text-align: center
  color: #E4E8EA
  font-family: monospace
  font-size: 16px

.knob
  display: flex
  flex-direction: column
  align-items: center

.rela-block 
  position: relative
</style>
