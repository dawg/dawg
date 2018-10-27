<template>
  <div class="synth secondary" color="white">
    <dot-button
      :value="mute"
      @input="$emit('update:mute', $event)"
    ></dot-button>
    <v-select
      class="synth-dropdown"
      dense
      dark
      :items="types"
      :value="type"
      @input="$emit('update:type', $event)"
    ></v-select>
    <knob
      class="knob"
      text-color="white"
      :size="50"
      :value="volume"
      @input="$emit('update:volume', $event)"
    ></knob>
    <knob
      class="knob"
      text-color="white"
      :size="50"
      :min="-1"
      :max="1"
      :value="panning"
      @input="$emit('update:panning', $event)"
    ></knob>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Tone from 'tone';
import Knob from '@/components/Knob.vue';
import DotButton from '@/components/DotButton.vue';

import { Component, Prop } from 'vue-property-decorator';

@Component({ components: { Knob, DotButton } })
export default class Synth extends Vue {
    @Prop({type: String, required: true}) public type!: string;
    @Prop({type: Number, required: true}) public volume!: number;
    @Prop({type: Number, required: true}) public panning!: number;
    @Prop({type: Boolean, required: true}) public mute!: boolean;
    public types = ['pwm', 'sine', 'triangle', 'fatsawtooth', 'square'];

}

</script>

<style scoped lang="sass">
  .synth
    align-items: center
    display: flex
    padding-right: 10px

  .synth-dropdown
    padding-right: 5px

  .knob
    margin: 2.5px


</style>