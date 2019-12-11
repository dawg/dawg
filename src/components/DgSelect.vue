<template>
  <div class="inline-block relative w-full">
    <select
      class="
        block
        appearance-none
        w-full
        bg-default-lighten-1
        text-default
        border
        border-default-lighten-4
        hover:border-default-lighten-3
        px-4 
        py-2 
        pr-8 
        rounded 
        shadow 
        leading-tight 
        focus:outline-none 
        focus:shadow-none
      "
    >
      <option 
        v-for="option in processed"
        :key="option.value"
        :value="option.value"
      >
        {{ option.display }}
      </option>
    </select>
    <dg-mat-icon
      icon="expand_more"
      class="pointer-events-none absolute select-none inset-y-0 right-0 flex items-center px-2 fg-default-lighten-5"
    ></dg-mat-icon>
  </div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';

export type SelectOption = string | { value: string; display: string };

export default createComponent({
  name: 'DgSelect',
  props: {
    options: { type: Array as () => SelectOption[], required: true },
    value: { type: String, required: false },
  },
  setup(props) {
    return {
      processed: computed(() => {
        return props.options.map((option): { value: string; display: string } => {
          if (typeof option === 'string') {
            return {
              value: option,
              display: option,
            };
          } else {
            return option;
          }
        });
      }),
    };
  },
});
</script>
