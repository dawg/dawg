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
        :selected-tab.sync="openedSideTab.value"
      >
        <side-bar
          v-for="tab in dawg.ui.activityBar"
          :key="tab.name"
          :name="tab.name"
          :icon="tab.icon"
          :icon-props="tab.iconProps"
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
import { Vue, Component, Prop } from 'vue-property-decorator';
import BaseTabs from '@/components/BaseTabs.vue';
import SideBar from '@/components/SideBar.vue';
import { Watch } from '@/modules/update';
import { TOOLBAR_HEIGHT } from '@/constants';
import { Sample } from '@/core';
import * as dawg from '@/dawg';
import { ActivityBarItem } from '@/dawg/ui';

// TODO REMOVE GENERAL & WORKSPACE

@Component({
  components: {
    BaseTabs,
    SideBar,
  },
})
export default class SideTabs extends Vue {
  public dawg = dawg;

  get iconColor() {
    return dawg.theme.foreground;
  }

  get openedSideTab() {
    return dawg.activityBar.openedSideTab;
  }

  get headerStyle() {
    return {
      borderBottom: `1px solid ${dawg.theme.background}`,
      minHeight: `${TOOLBAR_HEIGHT + 1}px`,
      display: 'flex',
      alignItems: 'center',
    };
  }

  get itemLookup() {
    const lookup: { [name: string]: ActivityBarItem } = {};
    dawg.ui.activityBar.forEach((item) => {
      lookup[item.name] = item;
    });

    return lookup;
  }

  get actions() {
    if (this.openedSideTab.value === undefined) {
      return [];
    }

    return this.itemLookup[this.openedSideTab.value].actions || [];
  }

  get header() {
    if (this.openedSideTab.value) {
      return this.openedSideTab.value.toUpperCase();
    }
  }
}
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