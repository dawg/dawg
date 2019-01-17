<template>
  <div 
    class="sample-viewer secondary"
  >
    <div class="sample">    
      <wav-scope
        ref="scope"
        :url=url
      >
      </wav-scope>
    </div>
    <div class="sample-controls white--text">
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

@Component({components: { WavScope, PlayPause }})
export default class SampleViewer extends Vue {
  @Prop({ type: String, required: true }) public url?: string;

  public $refs!: {
    scope: WavScope;
  };

  public playSample() {
    this.$refs.scope.play();
  }

  public pauseSample() {
    this.$refs.scope.pause();
  }
}
</script>

<style lang="sass" scoped>
.sample-viewer
  border-top: 1px solid #111
  height: 100%
  padding: 40px

.sample-controls
  // text-align: center
  padding-top: 20px

.control
  margin-right: 10px

.button
  border: solid 1px #111
  padding: 5px
  border-radius: 5px

</style>