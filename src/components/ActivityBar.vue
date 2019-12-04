<template>
  <v-navigation-drawer
    permanent
    mini-variant
    class="secondary-lighten-2"
  >
    <dg-list style="height: 100%;">
      <dg-list-item
        v-for="item in base.ui.activityBar"
        :key="item.name"
        @click="clickActivityBar(item)"
      >
        <tooltip-icon
          class="icon"
          medium 
          :color="base.theme.foreground" 
          :tooltip="item.name"
          right
          v-bind="item.iconProps"
        >
          {{ item.icon }}
        </tooltip-icon>
      </dg-list-item>

      <div style="flex-grow: 1"></div>
      <dg-list-item style="display: flex">
        <v-icon
          class="icon"
          medium
          :color="base.theme.foreground"
          @click="openSettings"
        >
          settings
        </v-icon>
      </dg-list-item>
    </dg-list>
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

<style lang="scss">
.icon {
  // this centers the icons
  margin: auto;
  display: flex;
}
</style>