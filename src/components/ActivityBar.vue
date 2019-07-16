<template>
  <v-navigation-drawer
    permanent
    mini-variant
    class="secondary-lighten-2"
  >
    <v-list dense style="height: 100%; display: flex; flex-direction: column">
      <v-list-tile
        v-for="item in base.ui.activityBar"
        :key="item.name"
        @click="clickActivityBar(item)"
      >
        <tooltip-icon 
          medium 
          :color="iconColor" 
          :tooltip="item.name"
          right
          v-bind="item.iconProps"
        >
          {{ item.icon }}
        </tooltip-icon>
      </v-list-tile>

      <div style="flex-grow: 1"></div>
      <v-list-tile>
        <v-icon 
          medium
          :color="base.theme.foreground"
          @click="openSettings"
        >
          settings
        </v-icon>
        <v-menu
          v-model="open"
          :close-on-content-click="false"
          :position-x="x"
          :position-y="y"
          right
          top
        >
          <settings></settings>
        </v-menu>
      </v-list-tile>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import * as base from '@/base';
import { activityBar } from '@/dawg/extensions/core/activity-bar';
import { createComponent, value } from 'vue-function-api';

export default createComponent({
  name: 'ActivityBar',
  setup() {
    const open = value(false);
    const x = value(0);
    const y = value(0);

    function clickActivityBar(tab: base.ActivityBarItem) {
      base.clickActivityBarItem(tab);
      // TODO
      // activityBar.openedSideTab.value = tab.name;
    }

    function openSettings(e: MouseEvent) {
      open.value = true;
      x.value = e.clientX;
      y.value = e.clientY;
    }

    return {
      base,
      open,
      x,
      y,
    };
  },
});
</script>
