<template>
  <div class="playlist">
    <vue-perfect-scrollbar style="display: flex; height: 100%; overflow-y: scroll">
      <div style="display: flex; flex-direction: column">
        <div class="empty-block secondary"></div>
        <tracks :tracks="tracks" class="tracks"></tracks>
      </div>
      <playlist-sequencer
        style="width: calc(100% - 120px)"
        v-bind="$attrs"
      ></playlist-sequencer>
    </vue-perfect-scrollbar>
    <!-- <div style="overflow-y: scroll; display: flex; height: calc(100% - 20px)">
    </div> -->
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

  public added() {
    //
  }

  public removed() {
    //
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
  // TODO(jacob) Hardcoded ??
  height: 20px

.timeline
  width: calc(100% - 120px)

.timeline, .empty-block
  height: 20px
</style>