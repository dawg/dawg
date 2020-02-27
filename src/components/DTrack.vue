<template>
  <div 
    class="track border-t border-default-lighten-2 flex items-center text-default bg-default py-2 pl-3 pr-1"
  >
    <dot-button
      v-model="active"
      :value="color"
    ></dot-button>
    <editable class="select-none ml-3 truncate" v-model="track.name"></editable>
  </div>
</template>

<script lang="ts">
import { Track as T } from '@/models/track';
import * as framework from '@/lib/framework';
import { watch, ref, computed, createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'DgTrack',
  props: {
    track: { type: Object as () => T, required: true },
  },
  setup(props) {
    const active = ref(!props.track.mute);
    watch(active, () => {
      props.track.mute = !active.value;
    });

    return {
      active,
      color: computed(() => framework.theme.error),
    };
  },
});
</script>
