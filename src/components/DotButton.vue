<template>
  <v-btn icon @click="click" class="dot-button">
    <icon name="circle" scale="0.4" :class="color"></icon>
  </v-btn>
</template>

<script lang="ts">
import { createComponent } from '@/utils';
import { computed } from 'vue-function-api';

export default createComponent({
  name: 'DotButton',
  props: {
    value: { type: Boolean, required: true },
  },
  setup(props, context) {
    const color = computed(() => {
      if (props.value) {
        return 'primary--text';
      } else {
        return 'background--text';
      }
    });

    function click(e: MouseEvent) {
      e.stopPropagation();
      context.emit('input', !props.value);
    }

    return {
      color,
      click,
    };
  },
});
</script>

<style lang="sass" scoped>
.dot-button
  height: 20px
  width: 20px
  margin: 5px
</style>
