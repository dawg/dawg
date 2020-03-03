<template>
  <sequencer
    v-on="$listeners"
    v-bind="$attrs"
    :num-rows="tracks.length"
    :row-height="rowHeight"
    :row-class="rowClass"
    :side-width="130"
    :side-border="true"
    name="Playlist"
    :prototype.sync="prototype"
  >
    <template slot="side">
      <playlist-track
        v-for="(track, i) in tracks"
        :key="i" 
        :style="{ height: `${rowHeight}px`, marginTop: i === 1 ? '-1px' : '' }"
        :track="track"
        @contextmenu.native="trackOptions($event, i)"
      ></playlist-track>
    </template>
  </sequencer>
</template>

<script lang="ts">
import { Track } from '@/models';
import * as framework from '@/lib/framework';
import { createComponent, ref } from '@vue/composition-api';

export default createComponent({
  name: 'PlaylistSequencer',
  props: {
    rowHeight: { type: Number, required: true },
    tracks: { type: Array as () => Track[], required: true },
  },
  setup() {
    const prototype = ref();

    function trackOptions(event: MouseEvent, i: number) {
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


    function rowClass() {
      return 'bg-default border-b border-default-darken-2';
    }

    return {
      rowClass,
      trackOptions,
      prototype,
    };
  },
});
</script>
