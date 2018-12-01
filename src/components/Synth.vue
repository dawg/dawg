<template>
  <div class="synth-wrapper">
    <div 
      class="bar primary"
    ></div>
    <div 
      class="synth secondary-lighten-1" 
      color="white"
      :style="synthStyle"
      @click="expand = !expand"
    >
      <dot-button
        class="mute"
        :value="active"
        @input="changeMute"
      ></dot-button>
      <div class="white--text name">{{ name }}</div>
      <div style="flex: 1"></div>
      <knob
        class="knob"
        text-color="white"
        :size="knobSize"
        :stroke-width="strokeWidth"
        v-model="synth.volume.value"
      ></knob>
      <knob
        class="knob"
        text-color="white"
        :size="knobSize"
        :min="-1"
        :max="1"
        :stroke-width="strokeWidth"
        v-model="panner.pan.value"
      ></knob>
    </div>
    <div 
      class="options secondary-lighten-1"
      :class="{ expand }"
    >
      <v-select
        class="synth-dropdown"
        dense
        dark
        :items="types"
        v-model="synth.oscillator.type"
      ></v-select>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Tone from 'tone';
import Knob from '@/components/Knob.vue';
import DotButton from '@/components/DotButton.vue';

import { Component, Prop } from 'vue-property-decorator';

const TYPES = ['pwm', 'sine', 'triangle', 'fatsawtooth', 'square'];

const oscillator = { type: 'fatsawtooth', spread: 30 };
const envelope = {
  attack: 0.005,
  decay: 0.1,
  sustain: 0.3,
  release: 1,
};

@Component({ components: { Knob, DotButton } })
export default class Synth extends Vue {
  @Prop({ type: String, required: true }) public name!: string;
  @Prop({ type: Number, default: 50 }) public height!: number;
  // @Prop({ type: String, required: true }) public type!: string;
  // @Prop({ type: Number, required: true }) public volume!: number;
  // @Prop({ type: Number, required: true }) public panning!: number;
  // @Prop({ type: Boolean, required: true }) public mute!: boolean;
  public types = TYPES;
  public active = true;
  public panner = new Tone.Panner().toMaster();
  public synth = new Tone.Synth({ oscillator, envelope }).connect(this.panner);
  public out = this.panner;
  public expand = false;
  public strokeWidth = 2.5;
  public knobSize = 30;

  public get synthStyle() {
    return {
      height: `${this.height}px`,
    };
  }

  public changeMute(value: boolean) {
    this.active = value;
    if (value) {
      this.panner.toMaster();
    } else {
      this.panner.disconnect(Tone.Master);
    }
  }
}
</script>

<style scoped lang="sass">
.synth
  align-items: center
  display: flex
  padding-right: 10px

  &:hover
    cursor: pointer

.mute
  height: 25px
  width: 25px

.synth-dropdown
  padding: 5px 18px

.synth-dropdown /deep/ .v-input__slot
  margin: 0!important

.knob
  margin: 5px

.name
  font-size: 1.2em
  padding-right: 40px

.synth-wrapper
  display: flex
  flex-direction: column

.bar
  height: 5px

.options
  transition: height .5s
  height: 0
  overflow: hidden

.expand
  height: 55px
</style>