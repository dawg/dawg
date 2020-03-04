<template>
  <dg-fa-icon
    @click="click" 
    class="cursor-pointer"
    :class="color"
    style="font-size: 8px;"
    icon="circle"
  ></dg-fa-icon>
</template>

<script lang="ts">
import { computed , createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'DotButton',
  props: {
    value: { type: Boolean, required: true },
  },
  setup(props, context) {
    const color = computed(() => {
      if (props.value) {
        return 'fg-primary';
      } else {
        return 'fg-default-darken-3';
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
