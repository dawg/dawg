<template>
  <div 
    class="key"
    :class="keyClass" 
    :style="keyStyle" 
    @mousedown="mousedown"
    @mouseenter="enter"
    @mouseleave="exit"
  >
    <div
      :style="keyOverlay"
      class="overlay"
    ></div>
    <div v-if="text" class="text">{{ text }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Inject, Vue } from 'vue-property-decorator';
import Tone from 'tone';

@Component
export default class Key extends Vue {
  @Prop({ type: Number, required: true }) public keyHeight!: number;
  @Prop({ type: String, required: true }) public value!: string;
  @Prop({ type: Object, required: false }) public synth?: Tone.Synth;
  @Prop({ type: Number, default: 80 }) public width!: number;
  @Prop({ type: Number, default: 0.55 }) public widthProportion!: number;
  @Prop({ type: Number, default: 0.50 }) public heightProportion!: number;
  @Prop(Boolean) public borderBottom!: boolean;

  public down = false;
  public hover = false;

  get color() {
    return this.value.includes('#') ? 'black' : 'white';
  }

  get height() {
    return this.keyHeight * (12 / 7);  // all keys / white keys
  }

  get keyClass() {
    return {
      'c': this.isC,
      'primary-lighten-4': this.down,
      [`key--${this.color} ${this.value}`]: true,
    };
  }

  get isC() {
    return this.value.startsWith('C') && this.color === 'white';
  }

  get text() {
    if (this.isC) {
      return this.value;
    }
  }

  get percentage() {
    return this.hover ? 50 : this.isC ? 30 : 10;
  }

  get keyOverlay() {
    return {
      backgroundColor: this.$theme.primary + this.percentage,
      borderBottom: `1px solid ${this.$theme.primary + 10}`,
    };
  }

  get keyStyle() {
    if (this.color === 'black') {
      return {
        transform: `translate(0, -${(this.height * this.heightProportion) / 2}px)`,
        height: `${this.height * this.heightProportion}px`,
        width: `${this.width * this.widthProportion}px`,
      };
    }
    return {
      borderBottom: this.borderBottom ? 'solid 1px rgba(0, 0, 0, 0.06)' : '',
      height: `${this.height}px`,
      width: `${this.width}px`,
    };
  }

  public mousedown() {
    this.$emit('start', this.value);
    this.down = true;
    window.addEventListener('mouseup', this.mouseup);
  }

  public mouseup() {
    window.removeEventListener('mouseup', this.mouseup);
    this.down = false;
    this.$emit('stop', this.value);
  }

  public enter() {
    this.hover = true;
  }

  public exit() {
    this.hover = false;
  }
}
</script>

<style scoped lang="sass">
$color_white: #eee
$color_black: #3b3b3b

.overlay
  position: absolute
  left: 0
  right: 0
  top: 0
  bottom: 0
  
.text
  position: absolute
  user-select: none
  right: 0
  bottom: 0
  font-size: 0.8em

.key
  position: relative

.key--white
  background-color: $color_white

  &:hover
    background-color: darken($color_white, 6)

.key--black
  background-color: $color_black
  position: absolute
  z-index: 20
  transition: 0.1s
  &:hover
    background-color: darken($color_black, 6)

.c
  background-color: darken($color_white, 3)
</style>
