<template>
  <v-toolbar 
    class="secondary toolbar" 
    :height="height" 
    :style="`padding-left: ${offset}px; border-bottom: 1px solid`"
  >
    <v-btn icon><ico fa scale="2">circle-notch</ico></v-btn>
    <h1 class="white--text">{{ title }}</h1>
    <div style="border-left: 1px solid #fff; height:60%; margin: 20px"></div>
    

    <time-display :time="time"></time-display>
    <bpm :value="bpm" @input="updateBpm"></bpm>

    <v-spacer></v-spacer>

    <v-btn
      icon
      style="margin: 0"
      @click="playing = !playing"
    >
      <ico fa>{{ playing ? 'pause' : 'play' }}</ico>
    </v-btn>
    <v-btn icon style="margin: 0"><ico fa>stop</ico></v-btn>

  </v-toolbar>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import Bpm from '@/components/Bpm.vue';
import TimeDisplay from '@/components/TimeDisplay.vue';

@Component({
  components: { TimeDisplay, Bpm },
})
export default class Toolbar extends Vue {
  @Prop(Number) public height!: number;
  @Prop(Number) public offset!: number;
  @Prop({ type: Number, required: true }) public bpm!: number;

  public title = 'Vusic';
  public time = {
    mine: 0,
    sec: 0,
    milli: 0,
  };
  public playing = false;
  public updateBpm(value: number) {
    // TODO value is NaN
    this.$update('bpm', 120);
  }
}
</script>

<style scoped lang="sass">
  .clock
    font-size: 30px
    font-family: var(--monospace)
    margin-left: 10px
    padding: 0.2em .3em 0 .3em
    border: 3px solid rgba(0,0,0,.3)
    background-color: #222
    filter: none
    display: flex
    align-items: baseline
    box-sizing: border-box
    line-height: 1em

  .second, .small-text
    margin-left: 5px

  .small-text
    font-size: .5em

  .toolbar
    box-shadow: none
</style>
