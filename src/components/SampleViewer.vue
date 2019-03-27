<template>
  <div 
    class="sample-viewer secondary"
  >
    <div class="sample">    
      <!-- <waveform
        :buffer="buffer"
      ></waveform> -->
      <waveform-v2 class="wave" 
        v-if="buffer"
        :offset="0"
        :buffer="buffer"
      ></waveform-v2>
    </div>
    <div class="sample-controls foreground--text">
      <span class="control">
        <play-pause
          @play="playSample"
          @stop="pauseSample"
        ></play-pause>
      </span>
      <span class="control">
        <button   
          class="button" 
        >
          Separate
        </button>
      </span>
      <span class="control">
        <button   
          class="button" 
        >
          Transcribe
        </button>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import WavScope from '@/components/WavScope.vue';
import PlayPause from '@/components/PlayPause.vue';
import Tone from 'tone';
import { Watch } from '@/modules/update';
import { Sample } from '@/core';
import { Nullable } from '@/utils';

@Component({components: { WavScope, PlayPause }})
export default class SampleViewer extends Vue {
  @Prop(Nullable(Object)) public sample!: Sample | null;

  get buffer() {
    if (this.sample) {
      return this.sample.buffer;
    } else {
      return null;
    }
  }

  public playSample() {
    if (this.sample) {
      this.sample.preview();
    }
  }

  public pauseSample() {
    if (this.sample) {
      this.sample.stopPreview();
    }
  }
}
</script>

<style lang="sass" scoped>
.sample-viewer
  border-top: 1px solid #111
  height: 100%
  padding: 40px

.sample
  height: 100%
  width: 100%
  padding-bottom: 15px

.wave
  height: 100%
  width: 100%
  

.sample-controls
  // text-align: center
  padding-top: 20px
  position: fixed
  bottom: 35px

.control
  margin-right: 10px

.button
  border: solid 1px #111
  padding: 5px
  border-radius: 5px
</style>