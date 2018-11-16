<template>
  <v-app class="app" style="height: 100vh">
    <split direction="horizontal" grow resizable>
      <split :initial="65" fixed>
        <v-navigation-drawer
          permanent
          mini-variant
          class="secondary-lighten-2"
          :style="style"
        >
          <v-list dense style="height: 100%; display: flex; flex-direction: column">
            <v-list-tile
              v-for="item in items"
              :key="item.name"
              @click="click(item, $event)"
            >
              <v-icon medium color="white">{{ item.icon }}</v-icon>
            </v-list-tile>

            <div style="flex-grow: 1"></div>

            <v-list-tile @click="click">
              <v-icon medium color="white">settings</v-icon>
            </v-list-tile>
          </v-list>
        </v-navigation-drawer>
      </split>

      <split :initial="250" collapsible :min-size="100">
        <div class="aside secondary" style="display: flex; flex-direction: column">
          
          <div
            class="title center--vertial white--text"
            :style="`min-height: ${toolbarHeight + 1}px`"
          >
            <div>{{ title }}</div>
          </div>
          <vue-perfect-scrollbar class="scrollbar">
            <base-tabs ref="tabs" @changed="changed">
              <side-bar name="EXPLORER" icon="folder">
                <file-explorer></file-explorer>
              </side-bar>
              <side-bar name="SYNTHESIZERS" icon="playlist_add"></side-bar>
              <side-bar name="AUDIO FILES" icon="queue_music"></side-bar>
              <side-bar name="SEARCH" icon="search"></side-bar>
            </base-tabs>
          </vue-perfect-scrollbar>
          
        </div>
      </split>

      <split direction="vertical" grow resizable>

        <split :initial="toolbarHeight" fixed>
          <toolbar :height="toolbarHeight" style="padding-right: 26px"></toolbar>
        </split>

        <split>
          <tabs :style="`height: 100%`">
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
        </split>

        <split class="secondary" direction="vertical" :style="`border-top: 1px solid #111`">
          <split :initial="55" fixed>
            <ul class="tabs-headers" style="height: 55px">
              <li
                v-for="(tab, i) in panels"
                :key="i" 
                :class="{ 'is-active': tab.isActive }"
                class="tabs-header"
              >
                <div @click="selectPanel(tab.name, $event)" class="text white--text">{{ tab.name }}</div>
              </li>
            </ul>
          </split>
          <split>
            <base-tabs class="tabs-panels secondary" ref="panels" style="height: auto">
              <panel name="Mixer">
                <div></div>
              </panel>
              <panel name="Piano Roll">
                <piano-roll></piano-roll>
              </panel>
              <panel name="Sample">
                <div></div>
              </panel>
            </base-tabs>
          </split>
        </split>

      </split>
    </split>
    <foot :height="footerHeight"></foot>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import Toolbar from '@/components/Toolbar.vue';
import SideBar from '@/components/SideBar.vue';
import Foot from '@/components/Foot.vue';
import FileExplorer from '@/components/FileExplorer.vue';
import Tabs from '@/components/Tabs.vue';
import Tab from '@/components/Tab.vue';
import Panel from '@/components/Panel.vue';
import Split from '@/modules/split/Split.vue';
import PianoRoll from '@/components/PianoRoll.vue';
import BaseTabs from '@/components/BaseTabs.vue';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';

@Component({
  components: {
    SideBar,
    Toolbar,
    FileExplorer,
    Tabs,
    Tab,
    Foot,
    Panel,
    Split,
    PianoRoll,
    BaseTabs,
    VuePerfectScrollbar,
  },
})
export default class App extends Vue {
  public toolbarHeight = 64;
  public activityBarWidth = 60;
  public sidePanelWidth = 300;
  public footerHeight = 20;
  public node?: Element;
  public height = window.innerHeight;
  public title = '';
  public panelsTabs: BaseTabs | null = null;

  public tabs?: BaseTabs;
  public items: SideBar[] = [];

  public mounted() {
    this.tabs = this.$refs.tabs as BaseTabs;
    this.items = this.tabs.$children as SideBar[];
    this.panelsTabs = this.$refs.panels as BaseTabs;
    window.addEventListener('resize', this.handleResize);
  }

  get style() {
    return {
      flex: `0 0 ${this.activityBarWidth}px`,
    };
  }

  public click(tab: SideBar, $event: MouseEvent) {
    this.tabs!.selectTab(tab.name, $event);
  }
  public changed(tab: SideBar) {
    this.title = tab.name;
  }
  get totalWidth() {
    return this.activityBarWidth + this.sidePanelWidth;
  }
  public handleResize() {
    this.height = window.innerHeight;
  }
  public destroyed() {
    window.removeEventListener('resize', this.handleResize);
  }
  public selectPanel(name: string, e: MouseEvent) {
    this.panelsTabs!.selectTab(name, e);
  }
  get panels() {
    if (this.panelsTabs) {
      return this.panelsTabs.tabs;
    } else {
      return [];
    }
  }
}
</script>

<style lang="sass">
@import '~@/styles/global'
</style>

<style lang="sass" scoped>
.app
  display: flex
  flex-direction: column

.aside
  height: 100%
  width: 100%
  z-index: 3
  border-right: 1px solid

.title
  font-size: 15px !important
  border-bottom: 1px solid rgba(0, 0, 0, 0.3)
  padding: 0 20px

.scrollbar >>> .ps__scrollbar-y-rail
  background-color: transparent


.tabs-headers
  align-items: stretch
  display: flex
  padding: 0

.tabs-header
    position: relative
    color: #999
    font-size: 14px
    font-weight: 600
    list-style: none
    text-align: center
    padding: .75em 1em

    &.is-active
      color: #000
      box-shadow: unset
      
      & .text
        border-bottom: 1px solid

.text
  align-items: center
  text-decoration: none
  display: inline-block
  padding: 0 2px

  &:hover
    cursor: default
</style>

