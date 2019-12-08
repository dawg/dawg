<template>
  <dg-modal :value="value" @update="update">
    <template v-slot:header>
      <div class="flex px-4 py-4">
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
      <div class="pb-4">
        <div class="px-4 pt-4" v-for="(section, i) in processed" :key="i">
          <h1 class="text-default text-3xl">{{ section.title }}</h1>
          <div v-for="(setting, j) in section.settings" :key="setting.label">
            <h2
              class="text-default font-semibold text-lg"
              :class="j !== 0 ? 'mt-3' : ''"
            >{{ setting.label }}</h2>
            <div class="text-default text-sm mb-1" v-html="setting.description"></div>
            <dg-text-field
              class="max-w-full text-default"
              v-if="setting.type === 'string'"
              v-model="setting.value.value"
              :disabled="setting.disabled ? setting.disabled.value : false"
            ></dg-text-field>
            <label
              v-else-if="setting.type === 'boolean'" 
              class="text-default flex"
            >
              <input 
                class="mr-2 leading-tight"
                type="checkbox"
                v-model="setting.value.value"
                :disabled="setting.disabled ? setting.disabled.value : false"
              >
              <span class="text-xs leading-snug font-bold">
                {{setting.value.value ? setting.checkedValue : setting.uncheckedValue }}
              </span>
            </label>
            
            <dg-select
              v-else-if="setting.type === 'select'"
              class="select"
              v-model="setting.value.value"
              :options="setting.options"
              :disabled="setting.disabled ? setting.disabled.value : false"
            ></dg-select>
            <component v-else-if="setting.type === 'component'" :is="setting.component"></component>
          </div>
        </div>
      </div>
    </template>
  </dg-modal>
</template>

<script lang="ts">
import { Marked } from 'marked-ts';
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
        return dawg.manager.settings.map(({ title, settings }) => {
          return {
            title,
            settings: settings.map((setting): typeof setting => {
              return {
                ...setting,
                description: Marked.parse(setting.description),
              };
            }),
          };
        }).filter((section) => section.settings.length > 0).sort((a, b) => {
          return a.title.localeCompare(b.title);
        });
      }),
    };
  },
});
</script>

<style lang="scss" scoped>
.fade.in {
  opacity: 1;
}

.fade {
  transition: opacity .15s linear;
}

.settings {
  padding: 0 0 10px 0;
}

.select /deep/ .v-input__slot {
  margin: 0!important;
  max-width: 250px;
}

.select /deep/ .v-select__selections {
  margin: 0!important;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

</style>