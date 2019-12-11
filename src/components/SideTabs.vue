<template>
  <div class="aside bg-default flex flex-col">
    <div
      class="section-header text-lg text-default flex items-center border-b border-default-darken-3"
      :style="headerStyle"
    >
      <div class="aside--title">{{ header }}</div>
      <div class="flex-grow"></div>
      <dg-mat-icon
        v-for="action in actions"
        :key="action.icon.value"
        class="text-xl text-default cursor-pointer"
        v-tooltip.bottom="action.tooltip.value"
        :icon="action.icon.value"
        @click="action.callback"
      ></dg-mat-icon>
    </div>
    <vue-perfect-scrollbar class="scrollbar" style="height: 100%">
      <base-tabs
        ref="tabs"
        :selected-tab.sync="base.ui.openedSideTab.value"
        :first="base.ui.activityBar[0] ? base.ui.activityBar[0].name : undefined"
      >
        <tab
          v-for="tab in base.ui.activityBar"
          :key="tab.name"
          :name="tab.name"
          :selected-tab="base.ui.openedSideTab.value"
        >
          <component
            :is="tab.component"
          ></component>
        </tab>

      </base-tabs>
    </vue-perfect-scrollbar>
  </div>
</template>

<script lang="ts">
import BaseTabs from '@/components/BaseTabs.vue';
import Tab from '@/components/Tab.vue';
import { TOOLBAR_HEIGHT } from '@/constants';
import * as base from '@/base';
import { createComponent, computed } from '@vue/composition-api';

export default createComponent({
  name: 'SideTabs',
  components: {
    BaseTabs,
    Tab,
  },
  setup() {
    const headerStyle = computed(() => {
      return {
        minHeight: `${TOOLBAR_HEIGHT + 1}px`,
      };
    });

    const itemLookup = computed(() => {
      const lookup: { [name: string]: base.ActivityBarItem } = {};
      base.ui.activityBar.forEach((item) => {
        lookup[item.name] = item;
      });

      return lookup;
    });

    const actions = computed(() => {
      if (base.ui.openedSideTab.value === undefined) {
        return [];
      }

      if (itemLookup.value[base.ui.openedSideTab.value] === undefined) {
        return [];
      }

      return itemLookup.value[base.ui.openedSideTab.value].actions || [];
    });

    const header = computed(() => {
      if (base.ui.openedSideTab.value) {
        return base.ui.openedSideTab.value.toUpperCase();
      }
    });

    return {
      base,
      actions,
      header,
      headerStyle,
    };
  },
});
</script>

<style lang="sass" scoped>
.aside
  height: 100%
  width: 100%
  z-index: 3

.section-header
  padding: 0 20px

.scrollbar >>> .ps__scrollbar-y-rail
  background-color: transparent

.aside--title
  user-select: none
</style>