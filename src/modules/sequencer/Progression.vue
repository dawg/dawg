<template>
  <div class="progress" :style="style">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';

@Component
export default class Progression extends Vue {
  @Prop({ type: Number, required: true }) public pxPerBeat!: number;
  // Range from 0 to 1
  @Prop({ type: Number, required: true }) public progress!: number;
  @Prop({ type: Number, default: 0 }) public offset!: number; // TODO I'm not sure this is needed
  // Since the progress is a range from 0-1, this needs the bounds to calculate the position.
  @Prop({ type: Number, required: true }) public loopStart!: number;
  @Prop({ type: Number, required: true }) public loopEnd!: number;

  get progressPx() {
    return this.beatToPx((this.loopEnd - this.loopStart) * this.progress + this.loopStart);
  }

  public beatToPx(beat: number) {
    return (beat - this.offset) * this.pxPerBeat + 'px';
  }

  get style() {
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