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
    <div class="sample-controls text-default">
      <div style="flex: 1"></div>
      <span class="control">
        <play-pause
          @play="playSample"
          @stop="pauseSample"
        ></play-pause>
      </span>
      <span
        class="control" 
        v-for="(action, i) in actionsWithSamplePath"
        :key="i"
      >
        <button class="button" @click="action.callback"> {{ action.text }} </button>
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
import { Action } from '@/dawg/extensions/core/sample-viewer/types';

@Component({components: { PlayPause }})
export default class SampleViewer extends Vue {
  @Prop(Nullable(Object)) public sample!: Sample | null;
  @Prop({ type: Array, required: true }) public actions!: Action[];

  get actionsWithSamplePath() {
    return this.actions.map((action) => {
      return {
        text: action.text,
        callback: () => {
          if (this.samplePath) {
            action.callback(this.samplePath);
          }
        },
      };
    });
  }

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