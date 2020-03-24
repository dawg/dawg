<template>
  <drag-element class="rela-inline knob" @move="move" @after-move="afterMove">
    <div 
      class="rela-block knob-dial fg-primary" 
      :style="knobStyle"
      @contextmenu="contextmenu"
      @mouseenter="enter"
      @mouseleave="leave"
    >
      <svg 
        class="dial-svg" 
        :height="size" 
        :width="size"
      >
        <path
          :d="rangePath"
          fill="none"
          stroke="currentColor"
          class="fg-default-lighten-3"
          :class="strokeClass"
          :stroke-width="strokeWidth"
        ></path>
        <path 
          v-show="showRight"
          :d="rightRangePath" 
          fill="none"
          class="fg-primary"
          stroke="currentColor"
          :stroke-width="strokeWidth"
          :style="rightStrokeStyle"
        ></path>
        <path 
          v-show="showLeft"
          :d="leftRangePath"
          fill="none"
          class="fg-primary"
          stroke="currentColor"
          :stroke-width="strokeWidth"
          :style="leftStrokeStyle"
        ></path>
        <rect
          :width="rectWidth"
          :x="center - rectWidth / 2"
          :height="rectHeight"
          class="fg-primary"
          fill="currentColor"
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
  </drag-element>
</template>

<script lang="ts">
import * as dawg from '@/dawg';
import { mapRange } from '@/lib/std';
import { createComponent, computed } from '@vue/composition-api';

// Credit to the styling goes to this codepen: https://codepen.io/mavrK/pen/erQPvP
// They actually have some nice dials we may want to use

// Some things to note:
// 1. Most things here use angles from the +x axis; however, svg rotation starts from the +y axis
// 2. The rotation of the knob is clockwise so the minimum variables are actually the larger values

type Conversion = (x: number) => number;
const identity: Conversion = (x) => x;

export default createComponent({
  name: 'Knob',
  props: {
    value: { type: Number, required: true },
    name: { type: String },
    format: { type: Function as any as () => ((value: number) => string) },
    range: { type: Number, default: 264 },
    max: { type: Number, default: 100 },
    min: { type: Number, default: 0 },
    toUnit: { type: Function as any as () => Conversion, default: () => identity },
    fromUnit: { type: Function as any as () => Conversion, default: () => identity },
    size: { type: Number, default: 30 },
    strokeWidth: { type: Number, default: 2.5 },
    label: { type: String },
    midValue: { type: Number },
    strokeClass: { type: String },
    disableAutomation: { type: Boolean },
  },
  setup(props, context) {
    const rectWidth = 3;
    const rectHeight = props.size / 4;

    const converted = computed(() => props.fromUnit(props.value));

    const rotation = computed(() => {
      return mapRange(converted.value, props.min, props.max, -angle.value, angle.value);
    });

    const midDegrees = computed(() => {
      let midValue = props.midValue;
      if (midValue === undefined) { midValue = props.min; }
      return mapRange(midValue, props.min, props.max, minDegrees.value, maxDegrees.value);
    });

    const minDegrees = computed(() => {
      return 90 + angle.value;
    });

    const maxDegrees = computed(() => {
      return 90 - angle.value;
    });

    const maxRadians = computed(() => {
      return maxDegrees.value / 360 * 2 * Math.PI;
    });

    const minRadians = computed(() => {
      return minDegrees.value / 360 * 2 * Math.PI;
    });

    const midRadians = computed(() => {
      return midDegrees.value / 360 * 2 * Math.PI;
    });

    const minX = computed(() => {
      return center.value + (Math.cos(minRadians.value) * r.value);
    });

    const minY = computed(() => {
      return center.value - (Math.sin(minRadians.value) * r.value);
    });

    const maxX = computed(() => {
      return center.value + (Math.cos(maxRadians.value) * r.value);
    });

    const maxY = computed(() => {
      return center.value - (Math.sin(maxRadians.value) * r.value);
    });

    const midX = computed(() => {
      return center.value + (Math.cos(midRadians.value) * r.value);
    });

    const midY = computed(() => {
      return center.value - (Math.sin(midRadians.value) * r.value);
    });

    const angle = computed(() => {
      return props.range / 2;
    });

    const center = computed(() => {
      return props.size / 2;
    });

    const r = computed(() => {
      // We have to take off half of the stroke width due to how svg arcs work.
      // If we were to tell an svg to create an arc with radius 10 and a stroke-width of 2
      // the actual radius would be 11 (measuring from outside the path).
      // However, we want to be more exact than that. If the size is 20, we want the size the be exactly 20
      return props.size / 2 - props.strokeWidth / 2;
    });

    const labelStyle = computed(() => {
      const fontSize = `${Math.round(props.size / 3)}px`;
      return { fontSize };
    });

    // dial
    const transform = computed(() => {
      return `rotate(${rotation.value} ${center.value} ${center.value})`;
    });
    const knobStyle = computed(() => {
      return {
        height: `${props.size}px`,
        width: `${props.size}px`,
      };
    });

    // background path
    const rangePath = computed(() => {
      return `M ${minX.value} ${minY.value} A ${r.value} ${r.value} 0 1 1 ${maxX.value} ${maxY.value}`;
    });

    // left path
    const leftLarge = computed(() => {
      return leftRange.value > 180 ? 1 : 0;
    });

    const leftRangePath = computed(() => {
      return `M ${midX.value} ${midY.value} A ${r.value} ${r.value} 0 ${leftLarge.value} 0 ${minX.value} ${minY.value}`;
    });

    const leftLength = computed(() => {
      return (minRadians.value - midRadians.value) * r.value;
    });

    const leftRange = computed(() => {
      return minDegrees.value - midDegrees.value;
    });

    const leftAngleBetween = computed(() => {
      const ang = 90 - rotation.value; // Converting to start from +x axis
      return ang - midDegrees.value;
    });

    const showLeft = computed(() => {
      return leftAngleBetween.value > 0;
    });

    const leftStrokeStyle = computed(() => {
      let offset = leftRange.value - leftAngleBetween.value;
      offset = (offset / leftRange.value) * leftLength.value;
      return {
        'stroke-dasharray': leftLength.value,
        'stroke-dashoffset': offset,
      };
    });

    // right path
    const rightLarge = computed(() => {
      return rightRange.value > 180 ? 1 : 0;
    });

    const rightRangePath = computed(() => {
      // tslint:disable-next-line:max-line-length
      return `M ${midX.value} ${midY.value} A ${r.value} ${r.value} 0 ${rightLarge.value} 1 ${maxX.value} ${maxY.value}`;
    });

    const rightLength = computed(() => {
      return (midRadians.value - maxRadians.value) * r.value;
    });

    const rightRange = computed(() => {
      return midDegrees.value - maxDegrees.value;
    });

    const rightAngleBetween = computed(() => {
      const ang = 90 - rotation.value; // Converting to start from +x axis
      return midDegrees.value - ang;
    });

    const showRight = computed(() => {
      return rightAngleBetween.value > 0;
    });

    const rightStrokeStyle = computed(() => {
      let offset = rightRange.value - rightAngleBetween.value;
      offset = (offset / rightRange.value) * rightLength.value;
      return {
        'stroke-dasharray': rightLength.value,
        'stroke-dashoffset': offset,
      };
    });

    function defaultFormat() {
      return '' + Math.round(converted.value);
    }

    function enter() {
      if (props.name) {
        dawg.status.set({
          text: props.name,
          value: props.format ? props.format(converted.value) : defaultFormat(),
        });
      }
    }

    function leave() {
      dawg.status.set(null);
    }

    function move(e: MouseEvent) {
      // Multiply by a factor to const better = computed( speed=> .
      // This factor should eventually be computed by the changeX
      // For example, as they move farther away from their inital x position, the factor decreases
      let rot = rotation.value - e.movementY * 1.5;
      rot = Math.max(-132, Math.min(angle.value, rot));
      const value = mapRange(rot, -angle.value, angle.value, props.min, props.max);
      context.emit('input', props.toUnit(value));
      enter();
    }

    function afterMove() {
      // This isn't ideal but it works
      // For example, if they are still on the element, it will clear it
      // Even though we probably still want to display the value
      dawg.status.set(null);
    }

    function contextmenu(event: MouseEvent) {
      if (props.disableAutomation) {
        return;
      }

      dawg.context({
        position: event,
        items: [
          {
            text: 'Create Automation Clip',
            callback: () => context.emit('automate'),
          },
        ],
      });
    }

    return {
      move,
      afterMove,
      knobStyle,
      contextmenu,
      enter,
      leave,
      rangePath,
      showRight,
      rightRangePath,
      rightStrokeStyle,
      showLeft,
      leftRangePath,
      leftStrokeStyle,
      rectWidth,
      center,
      rectHeight,
      transform,
      labelStyle,
      converted,
    };
  },
});
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
