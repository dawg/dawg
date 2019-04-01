<template>
    <waveform
      v-if="ghost.buffer"
      :buffer="ghost.buffer"
    ></waveform>
</template>

<script lang="ts">

import { Vue, Component, Prop } from 'vue-property-decorator';
import Waveform from '@/modules/dawg/Waveform.vue';
import { ChunkGhost as Ghost } from '@/core/ghosts/ghost';

@Component({components: { Waveform }})
export default class ChunkGhost extends Vue {
  @Prop({ type: Object, required: true }) public ghost!: Ghost;


}
</script>

<style scoped>
</style>