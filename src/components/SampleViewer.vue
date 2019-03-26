<template>
  <div 
    class="sample-viewer secondary"
  >
    <div class="sample">    
      <wav-scope
        ref="scope"
        :url=url
        @click.native="playSample"
      >
      </wav-scope>
    </div>
    <div class="sample-controls foreground--text">
      <div style="flex: 1"></div>
      <span class="control">
        <v-btn   
          class="button foreground--text" 
          small
          flat
        >
          Separate
        </v-btn>
      </span>
      <span class="control">
        <v-btn   
          class="button foreground--text" 
          small
          flat
          :color="$theme.secondary + 60"
        >
          Transcribe
        </v-btn>
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
  display: flex
  padding-top: 5px

.control
  margin-right: 10px

.button
  margin: 5px 0
</style>