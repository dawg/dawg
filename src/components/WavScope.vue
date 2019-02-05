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

@Component({components: { }})
export default class WavScope extends Vue {
  @Prop({ type: String, required: true }) public url!: string;
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

    this.loadBlobFromUrl();
  }

  // follow the url and load as a blob
  public loadBlobFromUrl() {
      fetch(this.url).then((res: Response) => {
        res.blob().then((blob: Blob) => {
          this.wavesurfer.loadBlob(blob);
        });
    });
  }

  public load() {
    this.wavesurfer.load(this.url);
  }

  public play() {
    this.wavesurfer.play();
  }

  public pause() {
    this.wavesurfer.pause();
  }

  public playPause() {
    this.wavesurfer.playPause();
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