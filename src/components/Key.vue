<template>
  <div :class="keyClass" :style="keyStyle" @mousedown="play"></div>
</template>

<script>
import { px } from '@/mixins';
import { BLACK, WHITE } from '@/utils';

export default {
  name: 'Key',
  mixins: [px],
  props: {
    note: { type: String, required: true },
    synth: { type: Object, required: true },
    h: { type: Number, default: 44 },
    w: { type: Number, default: 250 },
    widthProportion: { type: Number, default: 0.55 },
    heightProportion: { type: Number, default: 0.50 },
    borderConfig: { type: Boolean, default: false },
  },
  computed: {
    color() {
      return this.note.includes('#') ? BLACK : WHITE;
    },
    keyClass() {
      return `key--${this.color}`;
    },
    keyStyle() {
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
    },
  },
  methods: {
    play() {
      this.synth.triggerAttackRelease(this.note, '8n');
    },
  },
};
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
