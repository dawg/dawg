<template>
  <!-- scale(-1, 1) flips the svg vertically -->
  <svg
    preserveAspectRatio="none"
    class="mini-score fg-primary"
    :viewBox="viewBox"
  >
    <rect
      v-for="rect in rects"
      :key="rect.key"
      :x="rect.x"
      :y="rect.y"
      :height="rect.height"
      :width="rect.width"
    ></rect>
  </svg>
</template>

<script lang="ts">
import { Note } from '@/core';
import { update } from '@/lib/vutils';
import { computed, watch, createComponent } from '@vue/composition-api';

/**
 * This class is used in the synth components to show the score associated with that synth.
 * We display a miniature version and adjust the size of the notes based on the min/max values.
 */
export default createComponent({
  name: 'MiniScore',
  props: {
    notes: { type: Array as () => Note[], required: true },
    // The height and width are only used to set the aspect ratio.
    // Use css to actually define the height and width
    height: { type: Number, default: 32 },
    width: { type: Number, default: 200 },
    offset: { type: Number, default: 0 },
    totalDuration: { type: Number as () => number | undefined },
  },
  setup(props, context) {
    const viewBox = computed(() => {
      return `0 0 ${props.width} ${props.height}`;
    });

    const rows = computed(() => {
      return props.notes.map(({ row }) => row);
    });

    const minRow = computed(() => {
      const min = Math.min(...rows.value);
      return min - min % 12;
    });

    const maxRow = computed(() => {
      const max = Math.max(...rows.value);
      return max + 11 - max % 12;
    });

    const difference = computed(() => {
      return maxRow.value - minRow.value + 1;
    });

    const endTimes = computed(() => {
      return props.notes.map(({ time, duration }) => time + duration);
    });

    const totalDuration = computed(() => {
      return Math.max(...endTimes.value);
    });

    watch(totalDuration, () => {
      update(props, context, 'totalDuration', totalDuration.value);
    });

    const rowHeight = computed(() => {
      return props.height / difference.value;
    });

    const columnWidth = computed(() => {
      return props.width / totalDuration.value;
    });

    const rects = computed(() => {
      return props.notes.map(({ row, time, duration }) => {
        const actualRow = row - minRow.value;
        const x = (time - props.offset) * columnWidth.value;
        const width = duration * columnWidth.value;
        if (x + width > 0 && x < props.width) {
          return {
            x: `${x}px`,
            width: `${width}px`,
            y: actualRow * rowHeight.value + 'px',
            height: `${rowHeight.value}px`,
          };
        }
      }).filter((rect) => rect);
    });

    return {
      rects,
      viewBox,
    };
  },
});
</script>

<style lang="sass" scoped>
.mini-score
  height: 100%
  width: 100%

svg
  fill: currentColor
</style>