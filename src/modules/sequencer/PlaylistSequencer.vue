<template>
  <sequencer
    v-on="$listeners"
    v-bind="$attrs"
    :num-rows="tracks.length"
    :row-height="rowHeight"
    :row-class="() => 'secondary'"
    :row-style="rowStyle"
    :side-width="130"
    name="Playlist"
    :prototype.sync="prototype"
  >
    <template slot="side">
      <d-track
        :style="{ height: `${rowHeight}px` }"
        v-for="(track, i) in tracks" 
        :key="i" 
        :track="track"
        @contextmenu.native="trackOptions($event, i)"
      ></d-track>
    </template>
  </sequencer>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import Sequencer from '@/modules/sequencer/Sequencer.vue';
import { Track } from '@/core';
import { toTickTime } from '@/utils';
import { theme } from '@/dawg/extensions/core/theme';
import * as base from '@/base';
import { ui } from '@/base/ui';

@Component({
  components: { Sequencer },
})
export default class PlaylistSequencer extends Vue {
  @Prop({ type: Number, required: true }) public rowHeight!: number;
  @Prop({ type: Array, required: true }) public tracks!: Track[];

  public prototype = null;

  public trackOptions(event: MouseEvent, i: number) {
    base.context({
      position: event,
      items: ui.trackContext.map((item) => {
        return {
          ...item,
          callback: () => {
            item.callback(i);
          },
        };
      }),
    });
  }


  public rowStyle() {
    return {
      borderBottom: `1px solid ${theme['text-inverse']}`,
    };
  }
}
</script>

<style lang="sass" scoped>

</style>