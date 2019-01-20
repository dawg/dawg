<template>
  <div class="wavform">
    <div id="surfer">
    </div>
  </div>
</template>

<script lang="ts">

import { Vue, Component, Prop, Mixins } from 'vue-property-decorator';
import WaveSurfer from 'wavesurfer.js';
import { Player } from 'tone';
import { Nullable } from '@/utils';
import { Watch } from '@/modules/update';
import { Positionable } from '@/modules/sequencer/sequencer';

@Component({components: { }})
export default class Waveform extends Vue {
  @Prop(Nullable(Object)) public buffer!: AudioBuffer | null;
  @Prop({ type: Number, default: 100 }) public height!: number;
  @Prop({ type: String, required: false, default: '#111' }) public waveColor?: string;
  @Prop({ type: String, required: false, default: '#1976D2' }) public progressColor?: string;

  public wavesurfer!: WaveSurfer;

  public mounted() {
    this.wavesurfer = WaveSurfer.create({
      container: '#surfer',
      waveColor: this.waveColor,
      progressColor: this.progressColor,
      responsive: true,
      loopSelection: true,
      height: this.height,
    });
  }

  @Watch<Waveform>('buffer')
  public load() {
    if (this.buffer) {
      this.wavesurfer.loadDecodedBuffer(this.buffer);
    }
  }
}
</script>

<style lang="sass" scoped>
.wavform
  z-index: 0
  display: flex
  flex-direction: column
  height: 100%

#surfer
  z-index: 0
</style>