<template>
  <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" type="text">
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'DgTextField',
  props: {
    value: { type: String, required: false },
    label: { type: String, required: false },
  },
  setup(props, context) {
    return {
      input(value: string) {
        context.emit('input', value);
      },
    };
  },
});
</script>
