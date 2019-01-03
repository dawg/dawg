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
                <div class="aside--title">{{ sidebarTabTitle }}</div>
              </div>
              <vue-perfect-scrollbar class="scrollbar" style="height: 100%">
                <base-tabs ref="tabs" @changed="changed">
                  <side-bar name="EXPLORER" icon="folder">
                    <file-explorer 
                      :folders.sync="app.folders"
                    ></file-explorer>
                  </side-bar>
                  <side-bar name="AUDIO FILES" icon="queue_music"></side-bar>
                  <side-bar name="PATTERNS" icon="queue_play">
                    <patterns v-model="selectedPattern" :patterns="project.patterns"></patterns>
                  </side-bar>
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
                  <panel name="Instruments">
                    <synths 
                      :instruments="instruments"
                      :selected-score.sync="selectedScore"
                      :selected-pattern="selectedPattern"
                      :synth.sync="selectedSynth"
                      :scores="selectedScore"
                    ></synths>
                  </panel>
                  <panel name="Mixer">
                    <div></div>
                  </panel>
                  <panel name="Piano Roll">
                    <piano-roll 
                      v-model="notes"
                      :synth="selectedSynth"
                      :loop-start.sync="loopStart"
                      :loop-end.sync="loopEnd"
                      :play="play"
                      @added="added"
                      @removed="removed"
                    ></piano-roll>
                  </panel>
                  <panel name="Sample">
                    <div></div>
                  </panel>
                </base-tabs>
              </split>
            </split>

          </split>
        </split>
        <split :initial="20" fixed>
          <foot
            :height="20"
            :project-name="projectName"
          ></foot>
        </split>
      </split>
    </dawg>
    <notifications/>
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
import Dawg from '@/components/Dawg.vue';
import Patterns from '@/components/Patterns.vue';
import Notifications from '@/modules/notification/Notifications.vue';
import Synths from '@/components/Synths.vue';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { remote, ipcRenderer } from 'electron';
import { Pattern, Instrument, Project, ValidateProject, Score, Note } from '@/models';
import io from '@/io';
import project from '@/project';
import { MapField, toTickTime, allKeys } from '@/utils';
import { Left } from 'fp-ts/lib/Either';
import Cache from '@/cache';
import Instru from '@/Instru';

const { dialog } = remote;

const FILTERS = [{ name: 'DAWG Files', extensions: ['dg'] }];

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
    Dawg,
    Notifications,
    Patterns,
    Synths,
  },
})
export default class App extends Vue {
  @MapField(project) public bpm!: number;

  public toolbarHeight = 64;
  public sidebarTabTitle = '';
  public panelsTabs: BaseTabs | null = null;
  public selectedSynth: Tone.PolySynth | null = null;
  public project = project;
  public selectedPattern: Pattern | null = null;
  public selectedScore: Score | null = null;
  public cache: Cache | null = null;

  public loopStart = 0;
  public loopEnd = 0;
  public play = false;
  public part = new Tone.Part(this.callback);

  public instruments: Instru[] = [];

  public $refs!: {
    tabs: BaseTabs,
    panels: BaseTabs,
  };

  public tabs?: BaseTabs;
  public items: SideBar[] = [];

  public async mounted() {
    this.tabs = this.$refs.tabs;
    this.items = this.tabs.$children as SideBar[];
    this.panelsTabs = this.$refs.panels;
    ipcRenderer.on('save', this.save);
    ipcRenderer.on('open', this.open);
    this.cache = await Cache.fromCacheFolder();

    this.panelsTabs.selectTab(this.cache.openedPanel);
    this.part.start(0);
    Tone.Transport.loop = true;
    this.part.humanize = true;
    Tone.Transport.bpm.value = 93;

    this.instruments = this.project.instruments.map((instrument) => {
      return new Instru(instrument);
    });
  }

  get notes() {
    if (!this.selectedScore) { return []; }
    return this.selectedScore.notes;
  }
  get projectName() {
    if (!this.cache || !this.cache.openedFile) { return null; }
    return path.basename(this.cache.openedFile).split('.')[0];
  }
  get instrumentLookup() {
    const instruments: {[k: string]: Instru} = {};
    this.instruments.forEach((instrument) => {
      instruments[instrument.name] = instrument;
    });
    return instruments;
  }
  public click(tab: SideBar, $event: MouseEvent) {
    this.tabs!.selectTab(tab.name, $event);
  }
  public changed(tab: SideBar) {
    this.sidebarTabTitle = tab.name;
  }
  public selectPanel(name: string, e: MouseEvent) {
    if (this.cache) {
      this.cache.openedPanel = name;
    }
    this.panelsTabs!.selectTab(name, e);
  }
  get panels() {
    if (this.panelsTabs) {
      return this.panelsTabs.tabs;
    } else {
      return [];
    }
  }
  public save() {
    if (!this.cache) { return; }

    if (!this.cache.openedFile) {
      this.cache.openedFile = dialog.showSaveDialog(remote.getCurrentWindow(), {});
      if (!this.cache.openedFile.endsWith('.dg')) {
        this.cache.openedFile = this.cache.openedFile + '.dg';
      }
    }

    // TODO Error handling
    fs.writeFileSync(
      this.cache.openedFile,
      JSON.stringify(io.encode(ValidateProject, this.$store.state.project), null, 4),
    );
  }
  public open() {
    if (!this.cache) { return; }

    // files can be undefined. There is an issue with the .d.ts files.
    const files = dialog.showOpenDialog(
      remote.getCurrentWindow(),
      { filters: FILTERS, properties: ['openFile'] },
    );

    if (!files) {
      return;
    }

    const filePath = files[0];
    this.cache.openedFile = filePath;
    let contents = fs.readFileSync(filePath).toString();

    try {
      contents = JSON.parse(contents);
    } catch (e) {
      this.$notify.error('Unable to parse file.');
      this.$log.error(e);
      return;
    }

    const result = ValidateProject.decode(contents);
    if (result instanceof Left) {
      this.$notify.error('Unable to decode file.');
      return;
    }

    project.reset(result.value);
  }
  public playPattern() {
    Tone.Transport.start();
    this.play = true;
  }
  public pausePattern() {
    Tone.Transport.pause();
    this.play = false;
  }
  public playPause() {
    if (Tone.Transport.state === 'started') {
      this.pausePattern();
    } else {
      this.playPattern();
    }
  }
  public added(note: Note) {
    const time = toTickTime(note.time);
    this.$log.info(`Adding note at ${note.time} -> ${time}`);
    this.part.add(time, note);
  }
  public removed(note: Note, i: number) {
    const time = toTickTime(note.time);
    this.part.remove(time, note);
  }
  public callback(time: string, note: Note) {
    if (!this.selectedScore) { return; }
    const duration = toTickTime(note.duration);
    const value = allKeys[note.id].value;
    const instrument = this.instrumentLookup[this.selectedScore.instrument];
    instrument.triggerAttackRelease(value, duration, time);
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

