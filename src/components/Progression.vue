<template>
  <div class="progress" :style="style">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';

@Component
export default class Progression extends Vue {
  @Inject() public pxPerBeat!: number;
  @Prop({ type: Number, required: true }) public progress!: number;
  @Prop({ type: Number, default: 0 }) public offset!: number;
  @Prop({ type: Number, required: true }) public loopStart!: number;
  @Prop({ type: Number, required: true }) public loopEnd!: number;
  public get progressPx() {
    return this.beatToPx((this.loopEnd - this.loopStart) * this.progress + this.loopStart);
  }
  public beatToPx(beat: number) {
    return (beat - this.offset) * this.pxPerBeat + 'px';
  }
  public get style() {
    return {
      left: this.progressPx,
    };
  }
}
</script>

<style lang="sass" scoped>
.progress
  position: absolute
</style>