<template>
  <sequencer
    v-on="$listeners"
    v-bind="$attrs"
    :num-rows="tracks.length"
    :row-height="height"
    :row-class="() => 'secondary'"
    :row-style="rowStyle"
    :side-width="130"
    :part="part"
    name="Playlist"
    :prototype.sync="prototype"
  >
    <template slot="side">
      <d-track
        :style="{ height: `${height}px` }"
        v-for="(track, i) in tracks" 
        :key="i" 
        :track="track"
      ></d-track>
    </template>
  </sequencer>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Sequencer from '@/modules/sequencer/Sequencer.vue';
import { Track, Element, PlacedPattern, PlacedSample } from '@/schemas';
import { toTickTime } from '@/utils';
import Part from '@/modules/audio/part';

@Component({
  components: { Sequencer },
})
export default class PlaylistSequencer extends Vue {
  @Prop({ type: Array, required: true }) public tracks!: Track[];
  @Prop({ type: Object, required: true }) public part!: Part<Element>;
  public prototype = null;

  public height = 40;

  public rowStyle() {
    return {
      borderBottom: '1px solid black',
    };
  }
}
</script>

<style lang="sass" scoped>

</style>