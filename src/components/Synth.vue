<template>
  <!-- For some reason, @click isn't working on this component.
  However, this works when we add $emit -->
  <div 
    class="synth-wrapper"
    :class="{ selected }"
    style="position: relative; z-index: 10;"
  >
    <div 
      class="bar primary"
    ></div>
    <div 
      class="synth secondary-lighten-1" 
      color="white"
      :style="synthStyle"
      @dblclick="expand = !expand"
      @click="$emit('click', $event)"
    >
      <dot-button
        class="mute"
        :value="active"
        @input="changeMute"
      ></dot-button>
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
        :mid-value="0"
        :stroke-width="strokeWidth"
        v-model="panner.pan.value"
      ></knob>
      <div class="white--text name">{{ name }}</div>
      <mini-score :notes="notes"></mini-score>
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
        v-model="type"
      ></v-select>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Tone from 'tone';
import Knob from '@/components/Knob.vue';
import DotButton from '@/components/DotButton.vue';
import MiniScore from '@/components/MiniScore.vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Note } from '@/schemas';

const TYPES = ['pwm', 'sine', 'triangle', 'fatsawtooth', 'square'];

const oscillator = { type: 'fatsawtooth', spread: 30 };
const envelope = { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 };

@Component({ components: { Knob, DotButton, MiniScore } })
export default class Synth extends Vue {
  @Prop({ type: String, required: true }) public name!: string;
  @Prop({ type: Number, default: 50 }) public height!: number;
  @Prop({ type: Array, default: () => [] }) public notes!: Note[];
  public selected = false;
  // @Prop({ type: String, required: true }) public type!: string;
  // @Prop({ type: Number, required: true }) public volume!: number;
  // @Prop({ type: Number, required: true }) public panning!: number;
  // @Prop({ type: Boolean, required: true }) public mute!: boolean;

  public types = TYPES;
  public active = true;
  public panner = new Tone.Panner().toMaster();
  public synth = new Tone.PolySynth(8, Tone.Synth).connect(this.panner);
  public expand = false;
  public strokeWidth = 2.5;
  public knobSize = 30;

  public type = 'fatsawtooth';

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
  public mounted() {
    // this.synth.set({ oscillator, envelope });
  }

  @Watch('type', { immediate: true })
  public onTypeChange() {
    // this.synth.set({ oscillator: { type: this.type } });
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
  height: 20px
  width: 20px
  margin: 5px

.synth-dropdown
  padding: 5px 18px

.synth-dropdown /deep/ .v-input__slot
  margin: 0!important

.knob
  margin: 5px

.name
  font-size: 1.2em
  padding-left: 10px
  padding-right: 20px
  user-select: none

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

.selected::after
  content: ''
  position: absolute
  top: 0
  right: 0
  bottom: 0
  left: 0
  border: 1px solid rgba(255, 255, 255, 0.36)
  pointer-events: none

// .selected
//   box-shadow: inset 0px 0px 0px 10px #f00
  // box-shadow: inset 0px 0px 0px 10px 
</style>