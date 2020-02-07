<template>
  <input
    ref="el"
    class="
      dg-text-field
      bg-default-lighten-1 
      shadow 
      appearance-none 
      border 
      rounded 
      py-2 
      px-3 
      leading-tight
      border-default-lighten-4
      focus:border-primary
      focus:shadow-none
      focus:outline-none 
    " 
    type="text"
    :value="value"
    @input="input"
    @click="click"
    :placeholder="placeholder"
  >
</template>

<script lang="ts">
import { createComponent, onMounted, ref } from '@vue/composition-api';

export default createComponent({
  name: 'DgTextField',
  props: {
    value: { type: String, required: false },
    label: { type: String, required: false },
    placeholder: { type: String, required: false },
    focus: { type: Boolean, required: false },
  },
  setup(props, context) {
    const el = ref<HTMLInputElement>(null);
    onMounted(() => {
      if (el.value && props.focus) {
        el.value.focus();
      }
    });

    return {
      el,
      input(value: InputEvent) {
        context.emit('input', (value.target! as HTMLInputElement).value);
      },
      click(e: MouseEvent) {
        context.emit('click', event);
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