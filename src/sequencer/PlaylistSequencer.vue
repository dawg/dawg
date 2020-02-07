<template>
  <sequencer
    v-on="$listeners"
    v-bind="$attrs"
    :num-rows="tracks.length"
    :row-height="rowHeight"
    :row-class="rowClass"
    :side-width="130"
    name="Playlist"
    :prototype.sync="prototype"
    :colored="true"
  >
    <template slot="side">
      <d-track
        v-for="(track, i) in tracks" 
        :key="i" 
        :style="{ height: `${rowHeight}px`, marginTop: i === 1 ? '-1px' : '' }"
        :track="track"
        @contextmenu.native="trackOptions($event, i)"
      ></d-track>
    </template>
  </sequencer>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import Sequencer from '@/sequencer/Sequencer.vue';
import { Track } from '@/core';
import { theme } from '@/dawg/extensions/core/theme';
import * as framework from '@/lib/framework';

@Component({
  components: { Sequencer },
})
export default class PlaylistSequencer extends Vue {
  @Prop({ type: Number, required: true }) public rowHeight!: number;
  @Prop({ type: Array, required: true }) public tracks!: Track[];

  public prototype = null;

  public trackOptions(event: MouseEvent, i: number) {
    framework.context({
      position: event,
      items: framework.ui.trackContext.map((item) => {
        return {
          ...item,
          callback: () => {
            item.callback(i);
          },
        };
      }),
    });
  }


  public rowClass() {
    return 'bg-default border-b border-default-darken-2';
  }
}
</script>

<style lang="sass" scoped>

</style>