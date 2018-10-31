<template>
  <v-app>
    <activity-bar 
      :activity-bar-width="activityBarWidth" 
      :side-panel-width="sidePanelWidth"
      :title-height="toolbarHeight"
      :padding-bottom="footerHeight"
    >
      <side-bar name="EXPLORER" icon="folder">
        <file-explorer></file-explorer>
      </side-bar>
      <side-bar name="SYNTHESIZERS" icon="playlist_add"></side-bar>
      <side-bar name="SYNTHESIZER" icon="queue_music"></side-bar>
      <side-bar name="SEARCH" icon="search"></side-bar>
    </activity-bar>

    <toolbar :offset="totalWidth" :height="toolbarHeight"></toolbar>
    
    <tabs :style="`padding-left: ${totalWidth}px; height: 600px`">
      <tab name="Playlist 1">
        <div></div>
      </tab>
      <tab name="Sequence 1">
        <div></div>
      </tab>
      <tab name="Sequence 2" :is-disabled="true">
        <div></div>
      </tab>
      <tab name="Sequence 4">
          <div></div>
      </tab>
      <tab name="Master">
          <div></div>
      </tab>
    </tabs>

    <panels :style="`padding-left: ${totalWidth}px; height: 100%; border-top: 1px solid #111`">
      <panel name="Mixer">
        <div></div>
      </panel>
      <panel name="Piano Roll">
        <div></div>
      </panel>
      <panel name="Sample">
        <div></div>
      </panel>
    </panels>

    <foot :height="footerHeight"></foot>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import Toolbar from '@/components/Toolbar.vue';
import SideBar from '@/components/SideBar.vue';
import ActivityBar from '@/components/ActivityBar.vue';
import Foot from '@/components/Foot.vue';
import FileExplorer from '@/components/FileExplorer.vue';
import Tabs from '@/components/Tabs.vue';
import Tab from '@/components/Tab.vue';
import Panels from '@/components/Panels.vue';
import Panel from '@/components/Panel.vue';

@Component({
  components: {
    ActivityBar,
    SideBar,
    Toolbar,
    FileExplorer,
    Tabs,
    Tab,
    Foot,
    Panels,
    Panel,
  },
})
export default class App extends Vue {
  public toolbarHeight = 64;
  public activityBarWidth = 60;
  public sidePanelWidth = 300;
  public footerHeight = 20;
  public node?: Element;
  public height = window.innerHeight;
  get totalWidth() {
    return this.activityBarWidth + this.sidePanelWidth;
  }
  public mounted() {
    window.addEventListener('resize', this.handleResize);
  }
  public handleResize() {
    this.height = window.innerHeight;
  }
  public destroyed() {
    window.removeEventListener('resize', this.handleResize);
  }
}
</script>

<style lang="sass">
@import '~@/styles/global'
</style>
