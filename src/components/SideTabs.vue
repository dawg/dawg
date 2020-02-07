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
        :title="action.tooltip.value"
        :icon="action.icon.value"
        @click="action.callback"
      ></dg-mat-icon>
    </div>
    <div class="h-full overflow-y-scroll">
      <base-tabs
        ref="tabs"
        :selected-tab.sync="openedSideTab"
        :first="framework.ui.activityBar[0] ? framework.ui.activityBar[0].name : undefined"
      >
        <tab
          v-for="tab in framework.ui.activityBar"
          :key="tab.name"
          :name="tab.name"
          :selected-tab="openedSideTab"
        >
          <component
            :is="tab.component"
          ></component>
        </tab>

      </base-tabs>
    </div>
  </div>
</template>

<script lang="ts">
import BaseTabs from '@/components/BaseTabs.vue';
import Tab from '@/components/Tab.vue';
import * as framework from '@/lib/framework';
import { createComponent, computed } from '@vue/composition-api';

export default createComponent({
  name: 'SideTabs',
  components: {
    BaseTabs,
    Tab,
  },
  props: {
    toolbarHeight: { type: Number, required: true },
  },
  setup(props) {
    const headerStyle = computed(() => {
      return {
        minHeight: `${props.toolbarHeight}px`,
      };
    });

    const itemLookup = computed(() => {
      const lookup: { [name: string]: framework.ActivityBarItem } = {};
      framework.ui.activityBar.forEach((item) => {
        lookup[item.name] = item;
      });

      return lookup;
    });

    const actions = computed(() => {
      if (framework.ui.openedSideTab.value === undefined) {
        return [];
      }

      if (itemLookup.value[framework.ui.openedSideTab.value] === undefined) {
        return [];
      }

      return itemLookup.value[framework.ui.openedSideTab.value].actions || [];
    });

    const header = computed(() => {
      if (framework.ui.openedSideTab.value) {
        return framework.ui.openedSideTab.value.toUpperCase();
      }
    });

    return {
      framework,
      actions,
      header,
      headerStyle,
      openedSideTab: framework.ui.openedSideTab,
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

.aside--title
  user-select: none
</style>