<template>
  <svg class="waveform" preserveAspectRatio="none" :viewBox="viewBox">
    <polygon 
      :points="points" 
      fill="currentColor"
      stroke="currentColor"
      class="text-default"
      style="stroke-width: 0.5; shape-rendering: geometricPrecision"
    ></polygon>
  </svg>
</template>

<script lang="ts">
import { Nullable } from '@/utils';
import * as framework from '@/framework';
import { createComponent, computed } from '@vue/composition-api';
import * as Audio from '@/audio';

export default createComponent({
  name: 'Waveform',
  props: {
    buffer: { type: AudioBuffer, required: true },
    /**
     * Offset in beats.
     */
    offset: { type: Number, required: false },
    /**
     * Duration in beats. Does *not* take into account the offset.
     */
    duration: { type: Number, required: false },
    height: { type: Number, default: 50 },
    steps: { type: Number, default: 5000 },
  },
  setup(props) {
    const viewBox = computed(() => {
      return '0 0 ' + props.steps + ' ' + props.height;
    });

    const h2 = computed(() => {
      return props.height / 2;
    });

    const data0 = computed(() => {
      return props.buffer.getChannelData(0);
    });

    const data1 = computed(() => {
      return props.buffer.numberOfChannels > 1 ? props.buffer.getChannelData(1) : data0.value;
    });

    const dataLen = computed(() => {
      return data0.value.length;
    });

    // The duration, in seconds, from the start of the buffer to the end (where it should stop rendering)
    // Does not take into account the offset
    const duration = computed(() => {
      return props.duration === undefined ?
        props.buffer.duration :
        Math.min(props.buffer.duration, Audio.Context.beatsToSeconds(props.duration));
    });

    // The offset in seconds
    const offset = computed(() => {
      return props.offset === undefined ? 0 : Audio.Context.beatsToSeconds(props.offset);
    });

    const actualDuration = computed(() => {
      return duration.value - offset.value;
    });

    const step = computed(() => {
      return actualDuration.value / props.buffer.duration * dataLen.value / props.steps;
    });

    const ind = computed(() => {
      return Math.floor((offset.value / props.buffer.duration) * dataLen.value);
    });

    const inc = computed(() => {
      return Math.floor(Math.max(1, step.value / 100));
    });

    const points = computed(() => {
      let dots0 = '0,' + (h2.value + data0.value[ind.value] * h2.value);
      let dots1 = '0,' + (h2.value + data1.value[ind.value] * h2.value);

      for (let p = 1; p < props.steps; p += 1) {
        let lmin = Infinity;
        let rmax = -Infinity;
        let i = Math.floor(ind.value + (p - 1) * step.value);
        const iend = i + step.value;

        for (; i < iend; i += inc.value) {
          lmin = Math.min(lmin, data0.value[i], data1.value[i]);
          rmax = Math.max(rmax, data0.value[i], data1.value[i]);
        }

        if (Math.abs(rmax - lmin) * h2.value < 1) {
          rmax += 1 / props.height;
          lmin -= 1 / props.height;
        }

        dots0 += ' ' + p + ',' + (h2.value + lmin * h2.value);
        dots1  =       p + ',' + (h2.value + rmax * h2.value) + ' ' + dots1;
      }

      return dots0 + ' ' + dots1;
    });

    return {
      viewBox,
      points,
    };
  },
});
</script>
