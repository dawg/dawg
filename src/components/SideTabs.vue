<template>
  <div class="aside secondary" style="display: flex; flex-direction: column">
    <div
      class="section-header foreground--text"
      :style="headerStyle"
    >
      <div class="aside--title">{{ header }}</div>
      <div style="flex-grow: 1"></div>
      <tooltip-icon
        v-for="action in actions"
        :key="action.icon"
        :tooltip="action.tooltip"
        bottom
        :color="iconColor"
        @click.native="action.callback"
      >
        {{ action.icon }}
      </tooltip-icon>
    </div>
    <vue-perfect-scrollbar class="scrollbar" style="height: 100%">
      <base-tabs
        ref="tabs"
        :selected-tab.sync="base.ui.openedSideTab.value"
        :first="base.ui.activityBar[0] ? base.ui.activityBar[0].name : undefined"
      >
        <side-bar
          v-for="tab in base.ui.activityBar"
          :key="tab.name"
          :name="tab.name"
          :icon="tab.icon"
          :icon-props="tab.iconProps"
          :selected-tab="base.ui.openedSideTab.value"
        >
          <component
            :is="tab.component"
          ></component>
        </side-bar>

      </base-tabs>
    </vue-perfect-scrollbar>
  </div>
</template>

<script lang="ts">
import BaseTabs from '@/components/BaseTabs.vue';
import SideBar from '@/components/SideBar.vue';
import { TOOLBAR_HEIGHT } from '@/constants';
import { Sample } from '@/core';
import * as base from '@/base';
import { createComponent, computed } from 'vue-function-api';

export default createComponent({
  name: 'SideTabs',
  components: {
    BaseTabs,
    SideBar,
  },
  setup() {
    const iconColor = computed(() => {
      return base.theme.foreground;
    });

    const headerStyle = computed(() => {
      return {
        borderBottom: `1px solid ${base.theme.background}`,
        minHeight: `${TOOLBAR_HEIGHT + 1}px`,
        display: 'flex',
        alignItems: 'center',
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
      iconColor,
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
  font-size: 15px !important
  padding: 0 20px

.scrollbar >>> .ps__scrollbar-y-rail
  background-color: transparent

.aside--title
  user-select: none
</style>