<template>
  <div class="flex flex-col bg-default-lighten-2" style="height: 100%;">
    <div
      v-for="item in items"
      :key="item.name"
      :title="item.name"
      class="pt-3 pb-3 text-center cursor-pointer flex flex-col hover:bg-default-lighten-1"
      @click="clickActivityBar(item)"
    >
      <dg-mat-icon
        class="text-2xl text-default"
        :icon="item.icon"
      ></dg-mat-icon>
    </div>

    <div class="flex-grow"></div>
    <div class="pt-3 pb-3 text-center cursor-pointer flex flex-col" title="Settings" @click="openSettings">
      <dg-mat-icon
        class="text-2xl text-default"
        icon="settings"
      ></dg-mat-icon>
    </div>
  </div>
</template>

<script lang="ts">
import * as framework from '@/framework';
import { createComponent, ref, watch, computed } from '@vue/composition-api';
import { sortOrdered } from '@/utils';

export default createComponent({
  name: 'ActivityBar',
  setup(_, context) {
    function clickActivityBar(tab: framework.ActivityBarItem) {
      framework.ui.openedSideTab.value = tab.name;
    }

    function openSettings(e: MouseEvent) {
      context.emit('open-settings');
    }

    return {
      openSettings,
      clickActivityBar,
      framework,
      open,
      items: computed(() => {
        return framework.ui.activityBar.sort(sortOrdered);
      }),
    };
  },
});
</script>
