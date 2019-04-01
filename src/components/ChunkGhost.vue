<template>
    <waveform-v2
      v-if="ghost.buffer"
      :buffer="ghost.buffer"
    ></waveform-v2>
</template>

<script lang="ts">

import { Vue, Component, Prop } from 'vue-property-decorator';
import WaveformV2 from '@/modules/dawg/WaveformV2.vue';
import { ChunkGhost as Ghost } from '@/core/ghosts/ghost';

@Component({components: { WaveformV2 }})
export default class ChunkGhost extends Vue {
  @Prop({ type: Object, required: true }) public ghost!: Ghost;


}
</script>

<style scoped>
</style>