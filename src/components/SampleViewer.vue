<template>
  <div 
    class="sample-viewer secondary"
  >
    <div class="sample">    
      <waveform class="wave" 
        v-if="buffer"
        :buffer="buffer"
      ></waveform>
    </div>
    <div class="sample-controls foreground--text">
      <span class="control">
        <play-pause
          @play="playSample"
          @stop="pauseSample"
        ></play-pause>
      </span>
      <span class="control">
        <separation
          :samplePath="samplePath"
        ></separation>
      </span>
      <span class="control">
        <transcription
          :samplePath="samplePath"
        ></transcription>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import PlayPause from '@/components/PlayPause.vue';
import Tone from 'tone';
import { Watch } from '@/modules/update';
import { Sample } from '@/core';
import { Nullable } from '@/utils';

@Component({components: { PlayPause }})
export default class SampleViewer extends Vue {
  @Prop(Nullable(Object)) public sample!: Sample | null;

  get buffer() {
    if (this.sample) {
      return this.sample.buffer;
    } else {
      return null;
    }
  }

  get samplePath() {
    if (this.sample) {
      return this.sample.path;
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
  height: 100%
  padding-bottom: 70px
  padding-top: 5px
  padding-left: 40px
  padding-right: 40px

.sample
  height: 100%
  width: 100%

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
  border: solid 1px 
  padding: 5px
  border-radius: 5px
</style>