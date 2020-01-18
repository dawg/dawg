<template>
  <div class="flex flex-col bg-default-lighten-2" style="height: 100%;">
    <div
      v-for="item in base.ui.activityBar"
      :key="item.name"
      v-tooltip.right="item.name"
      class="pt-3 pb-3 text-center cursor-pointer flex flex-col hover:bg-default-lighten-1"
      @click="clickActivityBar(item)"
    >
      <dg-mat-icon
        class="text-2xl text-default"
        :icon="item.icon"
      ></dg-mat-icon>
    </div>

    <div class="flex-grow"></div>
    <div class="pt-3 pb-3 text-center cursor-pointer flex flex-col" v-tooltip.right="'Settings'" @click="openSettings">
      <dg-mat-icon
        class="text-2xl text-default"
        icon="settings"
      ></dg-mat-icon>
    </div>
  </div>
</template>

<script lang="ts">
import * as base from '@/base';
import { createComponent, ref, watch } from '@vue/composition-api';

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
