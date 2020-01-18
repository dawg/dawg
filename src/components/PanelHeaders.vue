<template>
  <ul class="flex items-stretch">
    <li
      v-for="(tab, i) in tabs"
      :key="i" 
      class="text-sm font-semibold p-3"
    >
      <div 
        @click="selectPanel(tab.name)"
        :class="addUnderline(tab)"
        class="text text-default select-none"
      >
        {{ tab.name }}
      </div>
    </li>
    <div class="flex-grow"></div>
    <dg-mat-icon
      class="text-default select-none px-3 py-2 cursor-pointer"
      v-for="action in actions"
      :key="action.icon.value"
      :icon="action.icon.value"
      v-bind="action.props"
      :title="action.tooltip.value"
      @click="action.callback"
    ></dg-mat-icon>
  </ul>
</template>

<script lang="ts">
import * as base from '@/base';
import { computed, createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'PanelHeaders',
  setup() {
    const itemLookup = computed(() => {
      const lookup: { [name: string]: base.PanelItem } = {};
      base.ui.panels.forEach((item) => {
        lookup[item.name] = item;
      });

      return lookup;
    });

    const actions = computed(() => {
      if (base.ui.openedPanel.value === undefined) {
        return [];
      }

      const panel = itemLookup.value[base.ui.openedPanel.value];
      if (!panel) {
        return [];
      }

      return panel.actions || [];
    });

    const tabs = computed(() => {
      return base.ui.panels;
    });

    function addUnderline(tab: base.PanelItem) {
      if (tab.name === base.ui.openedPanel.value) {
        return 'border-b';
      }
    }

    function selectPanel(name: string) {
      base.ui.openedPanel.value = name;
    }

    return {
      addUnderline,
      selectPanel,
      tabs,
      actions,
    };
  },
});
</script>
