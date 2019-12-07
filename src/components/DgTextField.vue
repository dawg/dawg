<template>
  <div>
    <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
      Username
    </label>
    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" type="text" placeholder="Username">
  </div>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'DgTextField',
  props: {
    value: { type: String, required: false },
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

<style lang="scss" scoped>
.dg-text-field ::v-deep label, 
.dg-text-field ::v-deep input {
  color: var(--foreground)!important;
}

.dg-text-field ::v-deep .v-input__slot:before {
  border-color: var(--foreground)!important;
}

.dg-text-field {
  padding: 0;
  margin: 0;
}
</style>