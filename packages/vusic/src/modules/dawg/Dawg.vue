<template>
  <div class="dawg">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Provide } from 'vue-property-decorator';

@Component
export default class Dawg extends Vue {
  @Provide() public stepsPerBeat = 4;
  @Provide() public beatsPerMeasure = 4;
  @Provide() public snap = 0.25;
  @Provide() public pxPerBeat = 80;
  @Provide() public pxPerStep = this.pxPerBeat / this.stepsPerBeat;
  @Provide() public noteHeight = 16;
  @Provide() public trackHeight = 40;
}
</script>

<style lang="sass" scoped>

</style>