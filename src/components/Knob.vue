<template>
  <div class="rela-inline knob" :ref="dragRef">
    <div 
      class="rela-block knob-dial" 
      :style="knobStyle"
    >
      <div 
        class="abs-center dial-grip" 
        :style="rectStyle" 
      ></div>
      <svg class="dial-svg" viewBox="0 0 100 100">
        <path
          d="M20,76 A 40 40 0 1 1 80 76" 
          fill="none"
          stroke="#55595C"
        ></path>
        <path 
          d="M20,76 A 40 40 0 1 1 80 76" 
          fill="none" 
          :stroke="primaryColor" 
          :style="strokeStyle"
        ></path>
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

// Credit goes to this codepen: https://codepen.io/mavrK/pen/erQPvP
// They actually have some nice dials we may want to use

@Component
export default class Knob extends Mixins(Draggable) {
  @Prop({ type: Number }) public value!: number;
  @Prop({ type: Number, default: 100 }) public max!: number;
  @Prop({ type: Number, default: 0 }) public min!: number;
  @Prop({ type: Number, default: 1 }) public stepSize!: number;
  @Prop({ type: Number, default: 100 }) public size!: number;
  @Prop({ type: String, default: '#409eff' }) public primaryColor!: string;
  @Prop(String) public label?: string;
  @Prop({ type: Number, default: 17 }) public strokeWidth!: number;

  public rotation!: number;
  public knob = {
    rotation: -132,
    selected: false,
  };

  public get strokeDashoffset() {
    return 184 - (184 / 264) * (this.knob.rotation + 132);
  }

  public get strokeStyle() {
    return { 'stroke-dashoffset': this.strokeDashoffset };
  }
  public get knobStyle() {
    return { color: this.primaryColor };
  }
  public get rectStyle() {
    return { transform: `translate(-50%,-50%) rotate(${this.knob.rotation}deg)` };
  }

  public move(e: MouseEvent, { changeY }: { changeY: number }) {
    this.knob.rotation -= changeY * 1.5; // multiply by a factor to get better speed
    this.knob.rotation = Math.max(-132, Math.min(132, this.knob.rotation));
    const value = this.mapRange(this.knob.rotation, -132, 132, this.min, this.max);
    this.$emit('input', value);
  }

  public mounted() {
    this.rotation = this.mapRange(this.value, this.min, this.max, -132, 132);
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

.knob-dial
  height: 100px
  width: 100px

.dial-grip
  border-radius: 100%
  z-index: 5
  height: 82px
  width: 82px

  &::after
    content: ""
    position: absolute
    top: 0
    left: 50%
    width: 2px
    transform: translateX(-50%)
    height: 25px
    width: 3px
    border-radius: 4px
    background-color: currentColor
    
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
