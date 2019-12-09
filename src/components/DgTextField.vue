<template>
  <input 
    class="
      dg-text-field
      bg-default-lighten-1 
      shadow 
      appearance-none 
      border 
      rounded 
      w-full 
      py-2 
      px-3 
      leading-tight
      border-default-lighten-4
      focus:border-primary
      focus:shadow-none
      focus:outline-none 
    " 
    id="username" 
    type="text"
    :value="value"
    @input="input"
  >
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
      input(value: InputEvent) {
        context.emit('input', (value.target! as HTMLInputElement).value);
      },
    };
  },
});
</script>

<style scoped>
.dg-text-field {
  transition: border 300ms ease-in-out;
}
</style>