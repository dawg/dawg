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
          :color="base.theme.foreground" 
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
      </v-list-tile>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import * as base from '@/base';
import { createComponent, ref } from '@vue/composition-api';

export default createComponent({
  name: 'ActivityBar',
  setup(_, context) {
    function clickActivityBar(tab: base.ActivityBarItem) {
      base.ui.openedSideTab.value = tab.name;
    }

    function openSettings(e: MouseEvent) {
      context.emit('open-settings');
    }

    return {
      openSettings,
      clickActivityBar,
      base,
      open,
    };
  },
});
</script>
