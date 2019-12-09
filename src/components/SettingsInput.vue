<template>
  <div>
    <h2
      class="text-default font-semibold text-lg"
    >{{ setting.label }}</h2>
    <div class="text-default text-sm leading-snug mb-1" v-html="description"></div>
    <dg-text-field
      class="max-w-full text-default"
      v-if="setting.type === 'string'"
      v-model="setting.value.value"
      :disabled="setting.disabled"
    ></dg-text-field>
    <label
      v-else-if="setting.type === 'boolean'" 
      class="text-default items-end flex"
    >
      <dg-checkbox
        v-model="setting.value.value"
        :disabled="setting.disabled"
        class="mr-2"
      ></dg-checkbox>
      <span class="text-xs leading-snug font-bold">
        {{ setting.value.value ? setting.checkedValue : setting.uncheckedValue }}
      </span>
    </label>
    
    <dg-select
      v-else-if="setting.type === 'select'"
      class="select"
      v-model="setting.value.value"
      :options="setting.options"
      :disabled="setting.disabled"
    ></dg-select>
    <component v-else-if="setting.type === 'component'" :is="setting.component"></component>
  </div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import { Setting } from '@/dawg/extensions';
import { Marked } from 'marked-ts';

export default createComponent({
  name: 'SettingsInput',
  props: {
    setting: { type: Object as () => Setting, required: true },
  },
  setup(props) {
    return {
      description: computed(() => {
        return Marked.parse(props.setting.description);
      }),
    };
  },
});
</script>

<style lang="sass" scoped>

</style>