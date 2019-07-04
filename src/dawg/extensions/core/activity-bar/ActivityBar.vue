<template>
  <v-navigation-drawer
    permanent
    mini-variant
    class="secondary-lighten-2"
  >
    <v-list dense style="height: 100%; display: flex; flex-direction: column">
      <v-list-tile
        v-for="item in dawg.ui.activityBar"
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
          :color="iconColor"
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
import { Vue, Component, Prop } from 'vue-property-decorator';
import Sidebar from '@/components/SideBar.vue';
import { PanelNames, SideTab } from '@/constants';
import Settings from '@/sections/Settings.vue';
import * as dawg from '@/dawg';
import { activityBar } from '@/dawg/extensions/core/activity-bar';

@Component({
  components: { Settings },
})
export default class ActivityBar extends Vue {
  public dawg = dawg;
  public open = false;
  public x = 0;
  public y = 0;

  get iconColor() {
    return dawg.theme.foreground;
  }

  public clickActivityBar(tab: Sidebar) {
    activityBar.openedSideTab.value = tab.name;
  }

  public openSettings(e: MouseEvent) {
    this.open = true;
    this.x = e.clientX;
    this.y = e.clientY;
  }
}
</script>

<style lang="sass" scoped>

</style>