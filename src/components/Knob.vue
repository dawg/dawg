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

<script>
import { draggable } from '@/mixins';

const RADIUS = 40;
const MID_X = 50;
const MID_Y = 50;
const MIN_RADIANS = (4 * Math.PI) / 3;
const MAX_RADIANS = -Math.PI / 3;

const MIN_X = MID_X + (Math.cos(MIN_RADIANS) * RADIUS);
const MIN_Y = MID_Y - (Math.sin(MIN_RADIANS) * RADIUS);
const MAX_X = MID_X + (Math.cos(MAX_RADIANS) * RADIUS);
const MAX_Y = MID_Y - (Math.sin(MAX_RADIANS) * RADIUS);

export default {
  name: 'Knob',
  data() {
    return { initialY: null };
  },
  props: {
    value: { type: Number },
    max: { type: Number, default: 100 },
    min: { type: Number, default: 0 },
    stepSize: { type: Number, default: 1 },
    size: { type: Number, default: 100 },
    primaryColor: { type: String, default: '#409eff' },
    secondaryColor: { type: String, default: '#dcdfe6' },
    textColor: { type: String, default: '#000' },
    strokeWidth: { type: Number, default: 17 },
    valueDisplayFunction: { type: Function, default: v => v },
    potentiometer: { type: Boolean, default: false },
    rectWidth: { type: Number, default: 6 },
  },
  mixins: [draggable],
  computed: {
    rangePath() {
      return `M ${MIN_X} ${MIN_Y} A ${RADIUS} ${RADIUS} 0 1 1 ${MAX_X} ${MAX_Y}`;
    },
    valuePath() {
      return `M ${this.zeroX} ${this.zeroY} A ${RADIUS} ${RADIUS} 0 ${this.largeArc} ${this.sweep} ${this.valueX} ${this.valueY}`;
    },
    showValue() {
      return (this.value >= this.min && this.value <= this.max) && !this.disabled;
    },
    zeroRadians() {
      /* this weird little bit of logic below is to handle the fact that usually we
            want the value arc to start drawing from the 'zero' point, but, in the case
            that the minimum and maximum values are both above zero, we set the 'zero point'
            at the supplied minimum, so the value arc renders as the user would expect */
      if (this.min > 0 && this.max > 0) {
        return this.mapRange(this.min, this.min, this.max, MIN_RADIANS, MAX_RADIANS);
      }
      return this.mapRange(0, this.min, this.max, MIN_RADIANS, MAX_RADIANS);
    },
    valueRadians() {
      return this.mapRange(this.value, this.min, this.max, MIN_RADIANS, MAX_RADIANS);
    },
    valueDegrees() {
      return ((this.valueRadians * 360) / 2 / Math.PI) - 90;
    },
    zeroX() {
      return MID_X + (Math.cos(this.zeroRadians) * RADIUS);
    },
    zeroY() {
      return MID_Y - (Math.sin(this.zeroRadians) * RADIUS);
    },
    valueX() {
      return MID_X + (Math.cos(this.valueRadians) * RADIUS);
    },
    valueY() {
      return MID_Y - (Math.sin(this.valueRadians) * RADIUS);
    },
    largeArc() {
      return Math.abs(this.zeroRadians - this.valueRadians) < Math.PI ? 0 : 1;
    },
    sweep() {
      return this.valueRadians > this.zeroRadians ? 0 : 1;
    },
    valueDisplay() {
      return this.valueDisplayFunction(this.value);
    },
    transform() {
      return `rotate(${-this.valueDegrees} ${this.center} ${this.center})`;
    },
    center() {
      return this.size / 2;
    },
  },
  methods: {
    move(e, { changeY }) {
      this.$emit('input', this.squash(this.value + Math.round(-changeY), this.min, this.max));
    },
  },
};
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
