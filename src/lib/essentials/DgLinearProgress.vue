<template>
  <div class="linear-activity bg-primary">
    <div class="determinate bg-primary" :style="style"></div>
  </div>
</template>

<script lang="ts">
import { createComponent, computed, watch } from '@vue/composition-api';

export default createComponent({
  name: 'DgLinearProgress',
  props: {
    /**
     * A number between (inclusive) 0 and 100.
     */
    progress: { type: Number, required: true },
  },
  setup(props) {
    return {
      style: computed(() => {
        return {
          width: `${Math.round(props.progress)}%`,
        };
      }),
    };
  },
});
</script>

<style lang="scss" scoped>
.linear-activity {
  width: 75%;
  overflow: hidden;
  height: 4px;
  background-color: #B3E5FC;
}

.determinate {
  position: relative;
  max-width: 100%;
  height: 100%;
  // transition: width 50ms ease-out 50ms;
}
</style>