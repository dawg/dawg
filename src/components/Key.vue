<template>
  <div :class="keyClass" :style="keyStyle" @mousedown="play"></div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator';
import Tone from 'tone';

import { PX } from '@/mixins';
import { BLACK, WHITE } from '@/utils';

@Component
export default class Key extends Mixins(PX) {
  @Prop(String) public note!: string;
  @Prop({type: Object, required: false}) public synth?: Tone.Synth;
  @Prop({type: Number, default: 16 * 1.71428571}) public h!: number;
  @Prop({type: Number, default: 80}) public w!: number;
  @Prop({type: Number, default: 0.55}) public widthProportion!: number;
  @Prop({type: Number, default: 0.50}) public heightProportion!: number;
  @Prop({type: Boolean, default: false}) public borderConfig!: boolean;

  get color() {
    return this.note.includes('#') ? BLACK : WHITE;
  }
  get keyClass() {
    return `key--${this.color} ${this.note}`;
  }
  get keyStyle() {
    if (this.color === BLACK) {
      return {
        transform: `translate(0, -${(this.h * this.heightProportion) / 2}px)`,
        ...this.hw(this.h * this.heightProportion, this.w * this.widthProportion),
      };
    }
    return {
      borderBottom: this.borderConfig ? 'solid 1px #b9b9b9' : '',
      ...this.hw(this.h, this.w),
    };
  }
  public play() {
    if (this.synth) {
      this.synth.triggerAttackRelease(this.note, '8n');
    }
  }
}
</script>

<style scoped lang="sass">
  @import '~@/styles/mixins'

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
