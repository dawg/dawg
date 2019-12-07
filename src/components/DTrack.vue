<template>
  <div class="track text-default secondary">
    <dot-button
      v-if="!recording"
      v-model="active"
    ></dot-button>
    <dot-button
      v-else
      v-model="recording"
      :value="color"
    ></dot-button>
    <div class="name">{{ track.name }}</div>
  </div>
</template>

<script lang="ts">
import { Track as T } from '@/core/track';
import * as base from '@/base';
import { watch, ref, computed, createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'DgTrack',
  props: {
    track: { type: Object as () => T, required: true },
    recording: { type: Boolean, default: false },
  },
  setup(props) {
    const active = ref(!props.track.mute);
    watch(active, () => {
      props.track.mute = !active.value;
    });

    return {
      active,
      color: computed(() => base.theme.error),
    };
  },
});
</script>

<style lang="scss" scoped>

.name {
  user-select: none;
}

// FIXME 20px and 5px is hardcoded! 
.track {
  display: flex;
  border: 0 solid;
  user-select: none;
  border-width: 1px 0;
  border-top-color: rgba(255, 255, 255, .07);
  border-bottom-color: rgba(255, 255, 255, .07);
  align-items: center;
  padding: 5px 10px 2px 5px;
}
</style>