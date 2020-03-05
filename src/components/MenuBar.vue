<template>
  <div class="flex items-stretch bg-default-lighten-3 text-default h-full">
    <!-- 
      padding: '2px 8px',
      userSelect: 'none',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      cursor: hover.value ? 'default' : undefined,
      background: hover.value ? 'rgba(255, 255, 255, 0.25)' : undefined,
     -->
    <div
      v-for="(subMenu, i) in menu.items"
      :key="i"
      class="select-none py-1 px-3 h-full flex items-center cursor-default"
      @click="select($event, subMenu)"
    >
      {{ subMenu.label }}
    </div>
    <div class="flex-grow"></div>
  </div>
</template>

<script lang="ts">
import { createComponent, ref, computed, watch } from '@vue/composition-api';
import * as framework from '@/lib/framework';
import { Menu, MenuItem } from 'electron';

interface SubMenuItem {
  text: string;
  callback: () => void;
}

interface SubMenu {
  name: string;
  items: Array<SubMenuItem | null>;
}

// https://github.com/dawg/dawg/blob/87fe2957d3c63c7fdfcff9c87c0a5abf47542f47/src/modules/menubar/index.ts
// https://github.com/dawg/dawg/blob/87fe2957d3c63c7fdfcff9c87c0a5abf47542f47/src/modules/context/ContextMenu.vue

export default createComponent({
  name: 'MenuBar',
  props: {
    menu: { type: Object as () => Menu, required: true },
    height: { type: String, default: '100%' },
    maximized: { type: Boolean, required: true },
  },
  setup() {
    return {
      select: (e: MouseEvent, subMenu: MenuItem) => {
        framework.menu({
          position: e,
          items: subMenu.submenu.items.map((item) => {
            return {
              text: item.label,
              callback: item.click as () => void,
              shortcut: item.accelerator,
            };
          }),
        });
      },
    };
  },
});
</script>
