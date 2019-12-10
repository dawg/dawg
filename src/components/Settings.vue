<template>
  <dg-modal :value="value" @input="update">
    <template v-slot:header>
      <div class="flex items-center px-4 py-4">
        <div class="text-default">Settings</div>
        <div class="flex-grow"></div>
        <dg-mat-icon 
          class="text-sm cursor-pointer text-default"
          @click="close"
          icon="close"
        ></dg-mat-icon>
      </div>
    </template>
    <template v-slot:body>
      <div class="pt-3 pb-8">
        <div class="px-4" :class="i !== 0 ? 'pt-6' : ''" v-for="(section, i) in processed" :key="i">
          <h1 class="text-default text-3xl">{{ section.title }}</h1>
          <settings-input 
            v-for="(setting, j) in section.settings" 
            :key="setting.label" 
            :class="j !== 0 ? 'mt-3' : ''"
            :setting="setting"
          ></settings-input>
        </div>
      </div>
    </template>
  </dg-modal>
</template>

<script lang="ts">
import * as dawg from '@/dawg';
import { createComponent, watch, computed } from '@vue/composition-api';

export default createComponent({
  name: 'Settings',
  props: {
    value: { type: Boolean, required: true },
  },
  setup(props, context) {
    return {
      update: (value: boolean) => {
        context.emit('input', value);
      },
      close: () => {
        context.emit('input', false);
      },
      processed: computed(() => {
        return dawg.manager.settings.filter((section) => {
          return section.settings.length > 0;
        }).sort((a, b) => {
          return a.title.localeCompare(b.title);
        });
      }),
    };
  },
});
</script>
