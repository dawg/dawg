<template>
  <div class="text-default flex items-baseline select-none">
    <span class="text-3xl">{{ minutes }}</span>
    <span class="text-3xl">:</span>
    <span class="text-3xl">{{ formattedSeconds }}</span>
    <span class="text-xs">.{{ formattedMillis }}</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { createComponent, computed } from '@vue/composition-api';

export default createComponent({
  name: 'TimeDisplay',
  props: {
    raw: { type: Number, required: true },
  },
  setup(props) {
    const mraw = computed(() => {
      return Math.max(props.raw, 0);
    });

    const minutes = computed(() => {
      return Math.floor(mraw.value / 60);
    });

    const formattedSeconds = computed(() => {
      return formatNumberLength(seconds.value, 2);
    });

    const seconds = computed(() => {
      return Math.floor(mraw.value - (minutes.value * 60));
    });

    const formattedMillis = computed(() => {
      return formatNumberLength(millis.value, 3);
    });

    const millis = computed(() => {
      return Math.floor((mraw.value - seconds.value) * 1000);
    });

    function formatNumberLength(num: number, length: number) {
      let r = `${num}`;
      while (r.length < length) {
        r = `0${r}`;
      }
      return r;
    }

    return {
      minutes,
      formattedSeconds,
      formattedMillis,
    };
  },
});
</script>
