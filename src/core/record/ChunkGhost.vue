<template>
    <waveform 
      class="ghost-wav"
      v-if="ghost.buffer"
      :style="waveformStyle"
      :buffer="ghost.buffer"
    ></waveform>
</template>

<script lang="ts">

import { Vue, Component, Prop } from 'vue-property-decorator';
import Waveform from '@/components/Waveform.vue';
import { ChunkGhost as Ghost } from '@/models/ghost';
import * as dawg from '@/dawg';

@Component({components: { Waveform }})
export default class ChunkGhost extends Vue {
  @Prop({ type: Object, required: true }) public ghost!: Ghost;
  @Prop({ type: Number, required: true }) public pxPerBeat!: number;

  get buffer() {
    return this.ghost.buffer;
  }

  get waveformStyle() {
    return {
      width: `${this.bufferWidth}px`,
      height: `40px`,
    };
  }

  get bufferWidth() {
    if (this.ghost.buffer) {
      return this.ghost.buffer.length / this.ghost.buffer.sampleRate / 60 * dawg.project.bpm.value * this.pxPerBeat;
    } else {
      return 0;
    }
  }
}
</script>

<style scoped lang="sass">
  .ghost-wav svg polygon
    fill-opacity: 0.5
</style>