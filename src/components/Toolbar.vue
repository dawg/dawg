<template>
  <v-toolbar fixed app clipped-left>
    <v-btn icon><icon scale="2" name="circle-notch"></icon></v-btn>
    <h1>{{ title }}</h1>
    <div style="border-left: 1px solid #fff; height:60%; margin: 20px"></div>
    <v-btn
        icon
        style="margin: 0"
        v-shortkey="['space']"
        @shortkey="playing = !playing"
        @click="playing = !playing"
    >
      <icon :name="playing ? 'pause-circle' : 'play-circle'" scale="1.4">
      </icon></v-btn>
    <v-btn icon style="margin: 0"><icon name="stop-circle" scale="1.4"></icon></v-btn>

    <time-display :time="time"></time-display>
    <bpm v-model="bpm"></bpm>

    <v-spacer></v-spacer>
    <v-btn icon><icon scale="1.3" name="user"></icon></v-btn>

  </v-toolbar>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import Bpm from '@/components/Bpm.vue';
import TimeDisplay from '@/components/TimeDisplay.vue';

@Component({
  components: {TimeDisplay, Bpm},
})
export default class Toolbar extends Vue {
  public title = 'Vuesic';
  public time = {
    mine: 0,
    sec: 0,
    milli: 0,
  };
  public bpm = 120;
  public playing = false;
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
</style>
