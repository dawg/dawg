<template>
    <waveform 
      class="ghost-wav"
      v-if="ghost.buffer"
      :style="waveformStyle"
      :buffer="ghost.buffer"
    ></waveform>
</template>

<script lang="ts">
import Waveform from '@/components/Waveform.vue';
import { ChunkGhost as Ghost } from '@/models/ghost';
import * as dawg from '@/dawg';
import { createComponent, computed } from '@vue/composition-api';

export default createComponent({
  components: { Waveform },
  name: 'ChunkGhost',
  props: {
    ghost: { type: Object as () => Ghost, required: true },
    pxPerBeat: { type: Number, required: true },
  },
  setup(props) {
    const waveformStyle = computed(() => {
      return {
        width: `${bufferWidth.value}px`,
        height: `40px`,
      };
    });

    const bufferWidth = computed(() => {
      if (props.ghost.buffer) {
        return (
          props.ghost.buffer.length /
          props.ghost.buffer.sampleRate / 60 *
          dawg.project.bpm.value * props.pxPerBeat
        );
      } else {
        return 0;
      }
    });

    return {
      waveformStyle,
    };
  },
});
</script>

<style scoped lang="sass">
  .ghost-wav svg polygon
    fill-opacity: 0.5
</style>