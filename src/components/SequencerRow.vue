<template>
  <div :style="style" @click="click"></div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins } from 'vue-property-decorator';
import { keyLookup } from '@/utils';

@Component
export default class SequencerRow extends Vue {
  @Prop({ type: Number, required: true }) public value!: number;
  @Prop({ type: Number, required: true }) public totalBeats!: number;
  @Prop({ type: Number, default: 0 }) public row!: number;
  @Prop({ type: Number, default: 0.25 }) public snap!: number; // TODO snap is hardcoded

  // TODO Remove these as props. They should use theme information.
  @Prop({ type: String, default: '#21252b' }) public blackColor!: string;
  @Prop({ type: String, default: '#282c34' }) public whiteColor!: string;

  get color() {
    const key = keyLookup[this.value].value;
    return key.includes('#') ? 'black' : 'white';
  }
  public get style() {
    return {
      height: `${this.noteHeight}px`,
      backgroundColor: this.colorLookup[this.color],
      width: `${this.pxPerBeat * this.totalBeats}px`,
    };
  }
  get colorLookup() {
    return {
      black: this.blackColor,
      white: this.whiteColor,
    };
  }
  public click(e: MouseEvent) {
    const left = this.$el.getBoundingClientRect().left;
    const x = e.clientX - left;
    let start = x / this.pxPerBeat;
    start = Math.floor(start / this.snap) * this.snap;
    this.$log.debug(x, e.clientX, left, start);
    this.$emit('click', this.value, start);
  }
}
</script>

<style lang="sass" scoped>

</style>