<template>
  <v-app class="app" style="height: 100vh">
    <dawg>
      <split direction="vertical">
        <split direction="horizontal" resizable>
          <split :initial="65" fixed>
            <v-navigation-drawer
              permanent
              mini-variant
              class="secondary-lighten-2"
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
                class="section-header center--vertial white--text"
                :style="`min-height: ${toolbarHeight + 1}px`"
              >
                <div class="aside--title">{{ title }}</div>
              </div>
              <vue-perfect-scrollbar class="scrollbar" style="height: 100%">
                <base-tabs ref="tabs" @changed="changed">
                  <side-bar name="EXPLORER" icon="folder">
                    <file-explorer></file-explorer>
                  </side-bar>
                  <side-bar name="SYNTHESIZERS" icon="playlist_add" ref="synthesizers">
                    <synth
                      v-for="(synth, i) in project.instruments"
                      :key="synth.name"
                      @click="selectSynth(i)"
                      :name="synth.name"
                    ></synth>
                  </side-bar>
                  <side-bar name="AUDIO FILES" icon="queue_music"></side-bar>
                  <side-bar name="SEARCH" icon="search"></side-bar>
                </base-tabs>
              </vue-perfect-scrollbar>
              
            </div>
          </split>

          <split direction="vertical" resizable>

            <split :initial="toolbarHeight" fixed>
              <toolbar 
                :height="toolbarHeight" 
                style="padding-right: 26px; border-bottom: 1px solid rgba(0, 0, 0, 0.3); z-index: 500"
                :bpm.sync="bpm"
              ></toolbar>
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

            <split class="secondary" direction="vertical" :style="`border-top: 1px solid #111`" keep>
              <split :initial="55" fixed>
                <ul class="tabs-headers">
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
                <base-tabs class="tabs-panels secondary" ref="panels">
                  <panel name="Mixer">
                    <div></div>
                  </panel>
                  <panel name="Piano Roll">
                    <piano-roll :synth="selectedSynth" v-model="notes"></piano-roll>
                  </panel>
                  <panel name="Sample">
                    <div></div>
                  </panel>
                </base-tabs>
              </split>
            </split>

          </split>
        </split>
        <split :initial="20" fixed><foot :height="20"></foot></split>
      </split>
    </dawg>
  </v-app>
</template>

<script lang="ts">
import fs from 'fs';
import os from 'os';
import path from 'path';
import Tone from 'tone';
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
import Synth from '@/components/Synth.vue';
import Dawg from '@/components/Dawg.vue';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { remote, ipcRenderer } from 'electron';
import { Pattern, Instrument, Project, ValidateProject } from '@/models';
import io from '@/io';
import project from '@/project';
import { MapField } from '@/utils';

const { dialog } = remote;

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
    Synth,
    Dawg,
  },
})
export default class App extends Vue {
  // TODO Remove this later once we have a demo project
  public filePath: string | null = null;
  @MapField(project) public bpm!: number;

  public toolbarHeight = 64;
  public title = '';
  public panelsTabs: BaseTabs | null = null;
  public synths: Synth[] = [];
  public selectedSynth: Tone.PolySynth | null = null;
  public notes = []; // TODO
  public project = project;

  public $refs!: {
    synthesizers: Vue,
    tabs: BaseTabs,
    panels: BaseTabs,
  };

  public tabs?: BaseTabs;
  public items: SideBar[] = [];

  public mounted() {
    this.synths = this.$refs.synthesizers.$children as Synth[];
    this.tabs = this.$refs.tabs;
    this.items = this.tabs.$children as SideBar[];
    this.panelsTabs = this.$refs.panels;
    ipcRenderer.on('save', this.save);
    this.panelsTabs.selectTab(localStorage.getItem('panel'));

    if (process.env.NODE_ENV !== 'production') {
      this.filePath = path.join(os.homedir(), 'Desktop', 'tester.dg');
    }
  }

  public click(tab: SideBar, $event: MouseEvent) {
    this.tabs!.selectTab(tab.name, $event);
  }
  public changed(tab: SideBar) {
    this.title = tab.name;
  }
  public selectPanel(name: string, e: MouseEvent) {
    localStorage.setItem('panel', name);
    this.panelsTabs!.selectTab(name, e);
  }
  public selectSynth(i: number) {
    this.synths.slice(0, i).forEach((synth) => synth.selected = false);
    this.synths.slice(i + 1).forEach((synth) => synth.selected = false);
    this.synths[i].selected = !this.synths[i].selected;

    if (this.synths[i].selected) {
      this.selectedSynth = this.synths[i].synth;
    } else {
      this.selectedSynth = null;
    }
  }
  get panels() {
    if (this.panelsTabs) {
      return this.panelsTabs.tabs;
    } else {
      return [];
    }
  }
  public save() {
    if (!this.filePath) {
      this.filePath = dialog.showSaveDialog(remote.getCurrentWindow(), {});
      if (!this.filePath.endsWith('.dg')) {
        this.filePath = this.filePath + '.dg';
      }
    }

    // TODO Error handling
    fs.writeFileSync(
      this.filePath,
      JSON.stringify(io.encode(ValidateProject, this.$store.state.project), null, 4),
    );
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

.section-header
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

.aside--title
  user-select: none

.text
  align-items: center
  text-decoration: noneSynth
  display: inline-blockSynth
  padding: 0 2px
  user-select: none

  &:hover
    cursor: default
</style>

