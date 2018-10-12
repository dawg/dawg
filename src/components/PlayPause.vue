<template>
  <button class="button" @click="click">{{ text }}</button>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component
export default class PlayPause extends Vue {
  @Prop({type: String, default: 'PLAY'}) public play!: string;
  @Prop({type: String, default: 'STOP'}) public stop!: string;
  public text = this.play;
  public playing = false;
  public click() {
    if (this.playing) {
      this.text = this.play;
      this.$emit('stop');
    } else {
      this.text = this.stop;
      this.$emit('play');
    }
    this.playing = !this.playing;
  }
}
</script>

<style scoped lang="sass">
  .button
    border: solid 1px
    padding: 5px
    border-radius: 5px
</style>
