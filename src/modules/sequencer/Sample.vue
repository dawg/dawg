<template>
  <waveform :buffer="buffer"></waveform>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Waveform from '@/modules/sequencer/Waveform.vue';
import { Nullable } from '@/utils';

@Component({
  components: { Waveform },
})
export default class NAME extends Vue {
  @Prop(Nullable(Object)) public buffer!: AudioBuffer;
}
</script>

<style lang="sass" scoped>

</style>