<template>
  <div
    class="sample-element"
    :style="style"
  >
    <div class="top"></div>
    <waveform 
      :style="waveformStyle"
      :buffer="buffer"
      :height="height"
      class="waveform"
    ></waveform>
    <resizable
      :duration="duration"
      @update:duration="updateDuration"
    ></resizable>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins } from 'vue-property-decorator';
import Waveform from '@/modules/sequencer/Waveform.vue';
import Resizable from '@/modules/sequencer/Resizable.vue';
import { Nullable } from '@/utils';
import { Positionable } from '@/modules/sequencer/sequencer';
import Tone from 'tone';
import { PlacedSample } from '@/schemas';

@Component({
  components: { Waveform, Resizable },
})
export default class Sample extends Mixins(Positionable) {
  @Prop(Nullable(Object)) public element!: PlacedSample;

  get buffer() {
    return this.element.buffer;
  }

  get waveformStyle() {
    return {
      width: this.px(this.bufferWidth),
      height: this.heightPx,
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
.sample-element
  background-color: #eee
  display: flex
  flex-direction: column
  overflow: hidden
  position: relative

.top
  background-color: #ccc
  height: 8px
  width: 100%

.waveform
  width: 100%
</style>