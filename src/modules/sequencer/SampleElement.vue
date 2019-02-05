<template>
  <div class="sample-element">
    <div class="top"></div>
    <waveform 
      :style="waveformStyle"
      :buffer="buffer"
      :height="height"
      class="waveform"
    ></waveform>
  </div>
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
  @Prop(Nullable(Object)) public element!: PlacedSample;

  get buffer() {
    return this.element.sample.buffer;
  }

  get waveformStyle() {
    return {
      width: `${this.bufferWidth}px`,
    };
  }

  get bufferBeats() {
    if (this.element) {
      return this.element.beats;
    } else {
      return 0;
    }
  }

  get bufferWidth() {
    return this.bufferBeats * this.pxPerBeat;
  }
}
</script>

<style lang="sass" scoped>
.sample-element
  background-color: #eee
  display: flex
  flex-direction: column
  overflow: hidden
  position: relative

  &:hover
    cursor: pointer

.top
  background-color: #ccc
  height: 8px
  width: 100%

.waveform
  width: 100%
</style>