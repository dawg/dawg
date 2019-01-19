<template>
  <div class="playlist">
    <div style="display: flex">
      <div class="empty-block secondary"></div>
      <timeline 
        v-model="progress" 
        class="timeline"
        :set-loop-end.sync="setLoopEnd"
        :set-loop-start.sync="setLoopStart"
        :loop-start="loopStart"
        :loop-end="loopEnd"
        :offset="offset"
      ></timeline>
    </div>
    <div style="overflow-y: scroll; display: flex; height: calc(100% - 20px)">
      <tracks :tracks="tracks" class="tracks"></tracks>
      <playlist-sequencer
        style="width: calc(100% - 120px)"
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
      ></playlist-sequencer>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import { Track } from '@/schemas';
import { Note } from 'tone';

@Component
export default class Playlist extends Vue {
  @Inject() public pxPerBeat!: number;

  @Prop({ type: Array, required: true }) public tracks!: Track[];
  @Prop({ type: Array, required: true }) public value!: Note[];

  public setLoopEnd = 0;
  public setLoopStart = 0;
  public loopStart = 0;
  public loopEnd = 0;
  public progress = 0;
  public sequencerLoopEnd = 0;
  public scrollLeft = 0;

  // Horizontal offset in beats.
  public get offset() {
    return this.scrollLeft / this.pxPerBeat;
  }

  public added() {
    //
  }

  public removed() {
    //
  }

  public scrollHorizontal(scrollLeft: number) {
    this.scrollLeft = scrollLeft;
  }
}
</script>

<style lang="sass" scoped>
.playlist
  display: flex
  flex-direction: column
  height: 100%

.empty-block, .tracks
  width: 120px

.timeline
  width: calc(100% - 120px)

.timeline, .empty-block
  height: 20px
</style>