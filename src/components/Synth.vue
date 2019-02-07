<template>
  <!-- For some reason, @click isn't working on this component.
  However, this works when we add $emit -->
  <div 
    class="synth-wrapper"
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
        v-model="active"
      ></dot-button>
      <knob
        class="knob"
        text-color="white"
        :size="knobSize"
        :stroke-width="strokeWidth"
        v-model="instrument.volume"
        @automate="automateVolume"
      ></knob>
      <knob
        class="knob"
        text-color="white"
        :size="knobSize"
        :min="-1"
        :max="1"
        :mid-value="0"
        :stroke-width="strokeWidth"
        v-model="instrument.pan"
        @automate="automatePan"
      ></knob>
      <div class="white--text name">{{ instrument.name }}</div>
      <mini-score :notes="notes"></mini-score>
      <channel-select 
        :value="channel"
        @input="setChannel"
      ></channel-select>
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
        v-model="instrument.type"
      ></v-select>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Tone from 'tone';
import DotButton from '@/components/DotButton.vue';
import MiniScore from '@/modules/dawg/MiniScore.vue';
import ChannelSelect from '@/components/ChannelSelect.vue';
import { Component, Prop } from 'vue-property-decorator';
import { Note, Instrument } from '@/schemas';
import { Watch } from '@/modules/update';
import { Nullable } from '@/utils';

const TYPES = ['pwm', 'sine', 'triangle', 'fatsawtooth', 'square'];

const oscillator = { type: 'fatsawtooth', spread: 30 };
const envelope = { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 };

@Component({ components: { DotButton, MiniScore, ChannelSelect } })
export default class Synth extends Vue {
  @Prop({ type: Object, required: true }) public instrument!: Instrument;
  @Prop({ type: Number, default: 50 }) public height!: number;
  @Prop({ type: Array, default: () => [] }) public notes!: Note[];
  @Prop(Nullable(Number)) public channel!: number | null;

  public types = TYPES;
  public active = !this.instrument.mute;
  public expand = false;
  public strokeWidth = 2.5;
  public knobSize = 30;

  get synthStyle() {
    return {
      height: `${this.height}px`,
    };
  }

  public setChannel(value: number | null) {
    this.$update('channel', value);
  }

  public automateVolume() {
    this.$automate(this.instrument, 'volume');
  }

  public automatePan() {
    this.$automate(this.instrument, 'pan');
  }

  @Watch<Synth>('active')
  public changeMute() {
    this.instrument.mute = !this.active;
  }
}
</script>

<style scoped lang="sass">
.synth
  align-items: center
  display: flex
  padding-right: 10px

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
  min-width: 140px
  margin: 0 auto
  display: block
  padding-left: 10px
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
</style>