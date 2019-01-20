<template>
  <div
    class="sample"
    :style="containerStyle"
  >
    <div class="top"></div>
    <waveform 
      :style="waveformStyle"
      :buffer="buffer"
      class="waveform"
    ></waveform>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins } from 'vue-property-decorator';
import Waveform from '@/modules/sequencer/Waveform.vue';
import { Nullable } from '@/utils';
import { Positionable } from '@/modules/sequencer/sequencer';
import Tone from 'tone';

@Component({
  components: { Waveform },
})
export default class Sample extends Mixins(Positionable) {
  @Prop(Nullable(Object)) public buffer!: AudioBuffer | null;

  get containerStyle() {
    return {
      width: this.widthPx,
    };
  }

  get waveformStyle() {
    return {
      width: this.px(this.bufferWidth),
    };
  }

  get bufferMinutes() {
    if (this.buffer) {
      return this.buffer.length / this.buffer.sampleRate / 60;
    } else {
      return 0;
    }
  }

  get bufferBeats() {
    return this.bufferMinutes * Tone.Transport.bpm.value;
  }

  get bufferWidth() {
    return this.bufferBeats * this.pxPerBeat;
  }
}
</script>

<style lang="sass" scoped>
.sample
  background-color: #eee
  display: flex
  flex-direction: column
  overflow: hidden

.top
  background-color: #ccc
  height: 8px
  width: 100%

.waveform
  width: 100%
</style>