<template>
  <div class="knob-control" :style="{ height: size-5 + 'px' }" :ref="dragRef">
    <!--suppress HtmlUnknownAttribute -->
    <svg
        v-if="potentiometer"
        :width="size"
        :height="size"
        viewBox="0 0 100 100">
      <circle :r="center" :cx="center" :cy="center" :fill="secondaryColor"></circle>
      <rect
          :width="rectWidth"
          :x="center - rectWidth / 2"
          :y="center - size / 8 * 4"
          :height="size / 3" fill="#000"
          :transform="transform"
      ></rect>
    </svg>

    <!--suppress HtmlUnknownAttribute -->
    <svg
        v-else
        :width="size"
        :height="size"
        viewBox="0 0 100 100">
      <path
          :d="rangePath"
          :stroke-width="strokeWidth"
          :stroke="secondaryColor"
          class="knob-control__range">
      </path>
      <path
          v-if="showValue"
          :d="valuePath"
          :stroke-width="strokeWidth"
          :stroke="primaryColor"
          class="knob-control__value">
      </path>
      <text
          v-if="showValue"
          :x="50"
          :y="57"
          text-anchor="middle"
          :fill="textColor"
          class="knob-control__text-display">
        {{ valueDisplay }}
      </text>
    </svg>

  </div>
</template>

<script lang="ts">
import { Draggable } from '@/mixins';
import { Component, Prop, Mixins } from 'vue-property-decorator';

const RADIUS = 40;
const MID_X = 50;
const MID_Y = 50;
const MIN_RADIANS = (4 * Math.PI) / 3;
const MAX_RADIANS = -Math.PI / 3;

const MIN_X = MID_X + (Math.cos(MIN_RADIANS) * RADIUS);
const MIN_Y = MID_Y - (Math.sin(MIN_RADIANS) * RADIUS);
const MAX_X = MID_X + (Math.cos(MAX_RADIANS) * RADIUS);
const MAX_Y = MID_Y - (Math.sin(MAX_RADIANS) * RADIUS);

@Component
export default class Knob extends Mixins(Draggable) {
  @Prop({ type: Number }) public value!: number;
  @Prop({ type: Number, default: 100 }) public max!: number;
  @Prop({ type: Number, default: 0 }) public min!: number;
  @Prop({ type: Number, default: 1 }) public stepSize!: number;
  @Prop({ type: Number, default: 100 }) public size!: number;
  @Prop({ type: String, default: '#409eff' }) public primaryColor!: string;
  @Prop({ type: String, default: '#dcdfe6' }) public secondaryColor!: string;
  @Prop({ type: String, default: '#000' }) public textColor!: string;
  @Prop({ type: Number, default: 17 }) public strokeWidth!: number;
  @Prop({ type: Function, default: (v: number) => ({}) }) public valueDisplayFunction!: (v: number) => void;
  @Prop({ type: Boolean, default: false }) public potentiometer!: boolean;
  @Prop({ type: Number, default: 6 }) public rectWidth!: number;
  public initialY = null;

  get rangePath() {
    return `M ${MIN_X} ${MIN_Y} A ${RADIUS} ${RADIUS} 0 1 1 ${MAX_X} ${MAX_Y}`;
  }
  get valuePath() {
    return `M ${this.zeroX} ${this.zeroY} A ${RADIUS} ${RADIUS} 0 ` +
    `${this.largeArc} ${this.sweep} ${this.valueX} ${this.valueY}`;
  }
  get showValue() {
    return (this.value >= this.min && this.value <= this.max) && !this.disabled;
  }
  get zeroRadians() {
    /* this weird little bit of logic below is to handle the fact that usually we
          want the value arc to start drawing from the 'zero' point, but, in the case
          that the minimum and maximum values are both above zero, we set the 'zero point'
          at the supplied minimum, so the value arc renders as the user would expect */
    if (this.min > 0 && this.max > 0) {
      return this.mapRange(this.min, this.min, this.max, MIN_RADIANS, MAX_RADIANS);
    }
    return this.mapRange(0, this.min, this.max, MIN_RADIANS, MAX_RADIANS);
  }
  get valueRadians() {
    return this.mapRange(this.value, this.min, this.max, MIN_RADIANS, MAX_RADIANS);
  }
  get valueDegrees() {
    return ((this.valueRadians * 360) / 2 / Math.PI) - 90;
  }
  get zeroX() {
    return MID_X + (Math.cos(this.zeroRadians) * RADIUS);
  }
  get zeroY() {
    return MID_Y - (Math.sin(this.zeroRadians) * RADIUS);
  }
  get valueX() {
    return MID_X + (Math.cos(this.valueRadians) * RADIUS);
  }
  get valueY() {
    return MID_Y - (Math.sin(this.valueRadians) * RADIUS);
  }
  get largeArc() {
    return Math.abs(this.zeroRadians - this.valueRadians) < Math.PI ? 0 : 1;
  }
  get sweep() {
    return this.valueRadians > this.zeroRadians ? 0 : 1;
  }
  get valueDisplay() {
    return this.valueDisplayFunction(this.value);
  }
  get transform() {
    return `rotate(${-this.valueDegrees} ${this.center} ${this.center})`;
  }
  get center() {
    return this.size / 2;
  }

  public move(e: MouseEvent, { changeY }: { changeY: number }) {
    this.$emit('input', this.squash(this.value + Math.round(-changeY), this.min, this.max));
  }
}
</script>

<style scoped lang="sass">
  .knob-control:hover
    cursor: ns-resize

  .knob-control__range
    fill: none
    transition: stroke .1s ease-in

  .knob-control__value
    fill: none

  .knob-control__text-display
    font-size: 1.3rem
    text-align: center
</style>
