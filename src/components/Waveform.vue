<template>
  <svg class="waveform" preserveAspectRatio="none" :viewBox="viewBox">
    <polygon 
      :points="points" 
      fill="currentColor"
      stoke="currentColor"
      class="text-default"
      style="stroke-width:0.2; shape-rendering: geometricPrecision"
    ></polygon>
  </svg>
</template>

<script lang="ts">

import { Player } from 'tone';
import { Nullable } from '@/utils';
import * as base from '@/base';
import { createComponent, computed } from '@vue/composition-api';

export default createComponent({
  name: 'Waveform',
  props: {
    buffer: { type: AudioBuffer, required: true },
    offset: { type: Number, default: 0 },
    height: { type: Number, default: 50 },
    width: { type: Number, default: 100 },
  },
  setup(props) {
    const viewBox = computed(() => {
      return '0 0 ' + steps.value + ' ' + props.height;
    });

    const h2 = computed(() => {
      return props.height / 2;
    });

    const steps = computed(() => {
      return props.width * 100;
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

    const duration = computed(() => {
      return props.buffer.duration - props.offset;
    });

    const step = computed(() => {
      return duration.value / props.buffer.duration * dataLen.value / steps.value;
    });

    const ind = computed(() => {
      return Math.floor((props.offset / props.buffer.duration) * dataLen.value);
    });

    const inc = computed(() => {
      return Math.floor(Math.max(1, step.value / 100));
    });

    const points = computed(() => {
      let dots0 = '0,' + (h2.value + data0.value[ind.value] * h2.value);
      let dots1 = '0,' + (h2.value + data1.value[ind.value] * h2.value);

      for (let p = 1; p < steps.value; p += 1) {
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

<style scoped>
</style>