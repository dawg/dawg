<template>
  <waveform
    :style="waveformStyle"
    :buffer="buffer"
    :height="height"
  ></waveform>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins, Inject } from 'vue-property-decorator';
import Waveform from '@/modules/sequencer/Waveform.vue';
import { Nullable } from '@/utils';
import Tone from 'tone';
import { PlacedSample } from '@/schemas';

@Component({
  components: { Waveform },
})
export default class SampleElement extends Vue {
  @Inject() public pxPerBeat!: number;
  @Prop({ type: Number, default: 100 }) public height!: number;
  @Prop({ type: Object, required: true }) public element!: PlacedSample;

  get buffer() {
    return this.element.sample.buffer;
  }

  get waveformStyle() {
    return {
      width: `${this.bufferWidth}px`,
    };
  }

  get bufferWidth() {
    return this.element.beats * this.pxPerBeat;
  }
}
</script>

<style lang="sass" scoped>
.sample-element
  width: 100%
</style>