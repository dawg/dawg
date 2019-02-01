<template>
  <div 
    class="key"
    :class="keyClass" 
    :style="keyStyle" 
    @mousedown="mousedown"
  ></div>
</template>

<script lang="ts">
import { Component, Prop, Inject, Vue } from 'vue-property-decorator';
import Tone from 'tone';

@Component
export default class Key extends Vue {
  @Inject() public noteHeight!: number;
  @Prop({ type: String, required: true }) public value!: string;
  @Prop({ type: Object, required: false }) public synth?: Tone.Synth;
  @Prop({ type: Number, default: 80 }) public width!: number;
  @Prop({ type: Number, default: 0.55 }) public widthProportion!: number;
  @Prop({ type: Number, default: 0.50 }) public heightProportion!: number;
  @Prop(Boolean) public borderBottom!: boolean;

  get color() {
    return this.value.includes('#') ? 'black' : 'white';
  }

  get height() {
    return this.noteHeight * (12 / 7);  // all keys / white keys
  }

  get keyClass() {
    return `key--${this.color} ${this.value}`;
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
    window.addEventListener('mouseup', this.mouseup);
  }

  public mouseup() {
    window.removeEventListener('mouseup', this.mouseup);
    this.$emit('stop', this.value);
  }
}
</script>

<style scoped lang="sass">
$color_white: #eee
$color_black: #3b3b3b

.key--white
  background-color: $color_white
  &:hover
    background-color: darken($color_white, 5)

.key--black
  background-color: $color_black
  position: absolute
  z-index: 20
  transition: 0.1s
  &:hover
    background-color: darken($color_black, 5)
</style>
