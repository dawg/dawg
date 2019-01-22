<template>
  <div class="piano-roll">
    <div style="display: flex">
      <div class="empty-block secondary"></div>
      <!-- <timeline 
        v-model="progress" 
        class="timeline"
        :set-loop-end.sync="setLoopEnd"
        :set-loop-start.sync="setLoopStart"
        :loop-start="loopStart"
        :loop-end="loopEnd"
        :offset="offset"
      ></timeline> -->
    </div>
    <div style="overflow-y: scroll; display: flex; height: calc(100% - 20px)">
      <piano :synth="instrument"></piano>
      <!-- <sequencer
        style="width: calc(100% - 80px)"
        v-model="value"
        @added="added"
        @removed="removed"
        @scroll-horizontal="scrollHorizontal"
        :sequencer-loop-end.sync="sequencerLoopEnd"
        :loop-start="loopStart"
        :loop-end="loopEnd"
        :set-loop-start="setLoopStart"
        :set-loop-end="setLoopEnd"
        :progress="progress"
      ></sequencer> -->
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import Tone from 'tone';
import Piano from '@/components/Piano.vue';
// import Sequencer from '@/components/Sequencer.vue';
// import Timeline from '@/components/Timeline.vue';
import { Note, Instrument } from '@/schemas';
import { toTickTime, allKeys } from '@/utils';
import { Transform } from 'stream';
import { Watch } from '@/modules/update';
import Part from '@/modules/audio/part';

@Component({components: {
  Piano,
  // Sequencer,
  // Timeline,
}})
export default class PianoRoll extends Vue {
  @Inject() public pxPerBeat!: number;
  @Prop({ type: Object, required: true }) public instrument!: Instrument;
  @Prop({ type: Array, required: true }) public value!: Note[];
  @Prop({ type: Object, required: true }) public part!: Part<Note>;
}
</script>

<style lang="sass" scoped>
.piano-roll
  border-top: 1px solid #111
  height: 100%

.timeline, .empty-block
  height: 20px

.timeline
  width: calc(100% - 80px)

.empty-block
  width: 80px
</style>