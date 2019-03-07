<template>
  <sequencer
    v-on="$listeners"
    v-bind="$attrs"
    :num-rows="tracks.length"
    :row-height="trackHeight"
    :row-class="() => 'secondary'"
    :row-style="rowStyle"
    :side-width="130"
    :transport="transport"
    name="Playlist"
    :prototype.sync="prototype"
  >
    <template slot="side">
      <d-track
        :style="{ height: `${trackHeight}px` }"
        v-for="(track, i) in tracks" 
        :key="i" 
        :track="track"
      ></d-track>
    </template>
  </sequencer>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import Sequencer from '@/modules/sequencer/Sequencer.vue';
import { Track, Element, PlacedPattern, PlacedSample } from '@/schemas';
import { toTickTime } from '@/utils';
import Transport from '@/modules/audio/transport';

@Component({
  components: { Sequencer },
})
export default class PlaylistSequencer extends Vue {
  @Inject() public trackHeight!: number;

  @Prop({ type: Array, required: true }) public tracks!: Track[];
  @Prop({ type: Object, required: true }) public transport!: Transport<Element>;

  public prototype = null;

  public rowStyle() {
    return {
      borderBottom: '1px solid black',
    };
  }
}
</script>

<style lang="sass" scoped>

</style>