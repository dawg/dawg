<template>
  <div class="progress absolute" :style="style">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { createComponent, computed, ref, watch } from '@vue/composition-api';

// TODO
// 1. The panel is going back to the wrong one for some reason
// 2. Can't change synths
// 3. When creating a loop and dragging near the edge of the screen, the screen should move too
// 8. Why are there still errors loading global/workspace?
// 10. themes don't work

export default createComponent({
  name: 'Progression',
  props: {
    pxPerBeat: { type: Number, required: true },
    // Range from 0 to 1
    position: { type: Number, required: true },
    scrollLeft: { type: Number, required: true },
    // Since the progress is a range from 0-1, this needs the bounds to calculate the position.
    loopStart: { type: Number, required: true },
    loopEnd: { type: Number, required: true },
  },
  setup(props) {
    const progressPx = computed(() => {
      return ((props.position * props.pxPerBeat) - props.scrollLeft) + 'px';
    });

    const style = computed(() => {
      return {
        left: progressPx.value,
      };
    });

    return {
      style,
    };
  },
});
</script>
