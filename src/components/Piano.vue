<template>
  <div class="octave-container">
    <div class="octave">
      <div
        v-for="(key, index) in allKeys"
        :key="key.value"
        class="note-wrapper"
      >
        <key
          :value="key.value"
          :key-height="keyHeight"
          :synth="synth"
          :border="index !== allKeys.length - 1"
          @start="start"
          @stop="stop"
        ></key>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Tone from 'tone';
import { Component, Prop } from 'vue-property-decorator';
import { allKeys } from '@/utils';
import Key from '@/components/Key.vue';
import { Instrument } from '@/core';

@Component({
  components: { Key },
})
export default class Piano extends Vue {
  @Prop({ type: Number, required: true }) public keyHeight!: number;
  @Prop({ type: Object, required: true }) public synth!: Instrument<any, any>;
  public allKeys = allKeys;

  public start(value: string) {
    this.synth.triggerAttack(value);
  }

  public stop(value: string) {
    // I'm not sure what would happen if there were two notes playing.
    // I assume it would stop both. I didn't see a way to only stops one.
    this.synth.triggerRelease(value);
  }
}
</script>

<style scoped lang="sass">
.note-wrapper
  position: relative
</style>
