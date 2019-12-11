<template>
  <div class="flex flex-col align-stretch">
    <h2
      class="text-default font-semibold text-lg"
    >{{ unwrap(setting.label) }}</h2>
    <div class="text-default text-sm leading-snug mb-1" v-html="description"></div>
    <dg-text-field
      class="max-w-full text-default"
      v-if="setting.type === 'string'"
      v-model="setting.value.value"
      :disabled="unwrap(setting.disabled)"
    ></dg-text-field>
    <label
      v-else-if="setting.type === 'boolean'" 
      class="text-default items-end flex"
    >
      <dg-checkbox
        v-model="setting.value.value"
        :disabled="unwrap(setting.disabled)"
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
      :disabled="unwrap(setting.disabled)"
    ></dg-select>
    <component v-else-if="setting.type === 'component'" :is="setting.component"></component>
  </div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import { Setting } from '@/dawg/extensions';
import { Marked } from 'marked-ts';
import { unwrap } from '../utils';

export default createComponent({
  name: 'SettingsInput',
  props: {
    setting: { type: Object as () => Setting, required: true },
  },
  setup(props) {
    return {
      description: computed(() => {
        return Marked.parse(unwrap(props.setting.description));
      }),
      unwrap,
    };
  },
});
</script>

<style lang="sass" scoped>

</style>