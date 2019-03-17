<template>
  <v-navigation-drawer
    permanent
    mini-variant
    class="secondary-lighten-2"
  >
    <v-list dense style="height: 100%; display: flex; flex-direction: column">
      <v-list-tile
        v-for="item in general.sideBarTabs"
        :key="item.name"
        @click="clickActivityBar(item)"
      >
        <tooltip-icon medium color="white" :tooltip="item.name" right>{{ item.icon }}</tooltip-icon>
      </v-list-tile>
      <div style="flex-grow: 1"></div>
      <v-list-tile>
        <v-icon 
          medium
          color="white"
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
          <settings
            :name="project.name"
            @update:name="project.setName"
            :backup="workspace.backup"
            @update:backup="workspace.setBackup"
          ></settings>
        </v-menu>
      </v-list-tile>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { workspace, general, project } from '@/store';
import Sidebar from '@/components/SideBar.vue';
import { PanelNames, SideTab } from '@/constants';

@Component
export default class ActivityBar extends Vue {
  public workspace = workspace;
  public general = general;
  public project = project;
  public open = false;
  public x = 0;
  public y = 0;

  public clickActivityBar(tab: Sidebar) {
    // TODO not the best
    workspace.setOpenedSideTab(tab.name as SideTab);
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