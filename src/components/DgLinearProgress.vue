<template>
  <div class="linear-activity bg-primary">
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
  },
  setup(props) {
    return {
      style: computed(() => {
        return {
          width: `${props.progress}%`,
        };
      }),
    };
  },
});
</script>

<style lang="scss" scoped>
.linear-activity {
  overflow: hidden;
  width: 50%;
  height: 4px;
  background-color: #B3E5FC;
  margin: 20px auto;
}

.determinate {
  position: relative;
  max-width: 100%;
  height: 100%;
  transition: width 500ms ease-out 1s;
}
</style>