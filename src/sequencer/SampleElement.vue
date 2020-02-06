<template>
  <waveform
    v-if="buffer"
    :style="waveformStyle"
    :offset="element.offset"
    :duration="element.duration"
    :buffer="buffer"
  ></waveform>
  <div v-else>
    <!-- Display nothing when the buffer is null -->
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins, Inject } from 'vue-property-decorator';
import Waveform from '@/components/Waveform.vue';
import { Nullable } from '@/utils';
import { ScheduledSample } from '@/core';
import { createComponent, computed } from '@vue/composition-api';

export default createComponent({
  components: { Waveform },
  name: 'SampleElement',
  props: {
    pxPerBeat: { type: Number, required: true },
    height: { type: Number, required: true },
    element: { type: Object as () => ScheduledSample, required: true },
  },
  setup(props) {
    const width = computed(() => {
      return (Math.min(props.element.duration, props.element.sample.beats) - props.element.offset) * props.pxPerBeat;
    });

    return {
      buffer: computed(() => {
        return props.element.sample.buffer;
      }),
      waveformStyle: computed(() => {
        return {
          width: `${width.value}px`,
          height: `${props.height}px`,
        };
      }),
    };
  },
});
</script>

<style lang="sass" scoped>
.sample-element
  width: 100%
</style>