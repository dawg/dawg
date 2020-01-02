<template>
  <div class="linear-activity bg-primary" :style="containerStyle">
    <div class="determinate" :style="style"></div>
  </div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';

export default createComponent({
  name: 'DgLinearProgress',
  props: {
    /**
     * A number between (inclusive) 0 and 100.
     */
    progress: { type: Number, required: true },
    percentage: { type: Number, default: 75 },
  },
  setup(props) {
    return {
      style: computed(() => {
        return {
          width: `${props.progress * props.percentage / 100}%`,
        };
      }),
      containerStyle: computed(() => ({ width: `${props.percentage}%` })),
    };
  },
});
</script>

<style lang="scss" scoped>
.linear-activity {
  overflow: hidden;
  height: 4px;
  background-color: #B3E5FC;
}

.determinate {
  position: relative;
  max-width: 100%;
  height: 100%;
  transition: width 500ms ease-out 1s;
}
</style>