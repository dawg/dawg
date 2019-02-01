<template>
  <sequencer
    v-on="$listeners"
    v-bind="$attrs"
    :num-rows="tracks.length"
    :row-height="40"
    :row-class="() => 'secondary'"
    :row-style="rowStyle"
    :width="130"
  >
    <template slot="side">
      <d-track
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
import { Track } from '@/schemas';

@Component({
  components: { Sequencer },
})
export default class PlaylistSequencer extends Vue {
  @Prop({ type: Array, required: true }) public tracks!: Track[];

  public rowStyle() {
    return {
      borderBottom: '1px solid black',
    };
  }
}
</script>

<style lang="sass" scoped>

</style>