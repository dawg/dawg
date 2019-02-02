<template>
  <div class="screen">
    <span class="text">{{ minutes }}</span>
    <span class="text colon">:</span>
    <span class="text">{{ formattedSeconds }}</span>
    <span class="small-text">. {{ formattedMillis }}</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component
export default class TimeDisplay extends Vue {
  @Prop({ type: Number, required: true }) public raw!: number;

  get minutes() {
    return Math.floor(this.raw / 60);
  }

  get formattedSeconds() {
    return this.formatNumberLength(this.seconds, 2);
  }

  get seconds() {
    return Math.floor(this.raw - (this.minutes * 60));
  }

  get formattedMillis() {
    return this.formatNumberLength(this.millis, 3);
  }

  get millis() {
    return Math.floor((this.raw - this.seconds) * 1000);
  }

  public formatNumberLength(num: number, length: number) {
    let r = `${num}`;
    while (r.length < length) {
      r = `0${r}`;
    }
    return r;
  }
}
</script>

<style scoped lang="sass">
  @import '~@/styles/screen'

  .colon
    margin: 0 2px
</style>
