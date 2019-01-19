<template>
  <div class="wav-scope">
    <div     
    id="surfer"
    >
    </div>
  </div>
</template>

<script lang="ts">

import { Vue, Component, Prop } from 'vue-property-decorator';
import WaveSurfer from 'wavesurfer.js';
import { Player } from 'tone';
import { Nullable } from '@/utils';
import { Watch } from '@/modules/update';

@Component({components: { }})
export default class WavScope extends Vue {
  @Prop(Nullable(Object)) public buffer!: AudioBuffer | null;
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
    });
  }

  @Watch<WavScope>('buffer')
  public load() {
    if (this.buffer) {
      this.wavesurfer.loadDecodedBuffer(this.buffer);
    }
  }
}
</script>

<style lang="sass" scoped>
.wav-scope
  z-index: 0
  display: flex
  flex-direction: column
  border: 1px solid #111 
  height: 100%
  border-radius: 10px

#surfer
  z-index: 0
</style>