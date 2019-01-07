<template>
  <v-app 
    class="app" 
  >
    <dawg>
      <split direction="vertical">
        <split direction="horizontal" resizable>
          <split :initial="65" fixed>
            <activity-bar :items="items" @click="clickActivityBar"></activity-bar>
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
                      v-if="cache"
                      :folders.sync="cache.folders"
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
                    <mixer></mixer>
                  </panel>
                  <panel name="Piano Roll">
                    <piano-roll 
                      v-model="notes"
                      :part="part"
                      :synth="selectedSynth"
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
            :opened-file="openedFile"
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
import { Component, Vue } from 'vue-property-decorator';
import Toolbar from '@/components/Toolbar.vue';
import SideBar from '@/components/SideBar.vue';
import Foot from '@/components/Foot.vue';
import FileExplorer from '@/components/FileExplorer.vue';
import ActivityBar from '@/components/ActivityBar.vue';
import Tabs from '@/components/Tabs.vue';
import Tab from '@/components/Tab.vue';
import Panel from '@/components/Panel.vue';
import Mixer from '@/components/Mixer.vue';
import Split from '@/modules/split/Split.vue';
import PianoRoll from '@/components/PianoRoll.vue';
import BaseTabs from '@/components/BaseTabs.vue';
import Dawg from '@/components/Dawg.vue';
import Patterns from '@/components/Patterns.vue';
import Notifications from '@/modules/notification/Notifications.vue';
import Synths from '@/components/Synths.vue';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { remote, ipcRenderer } from 'electron';
import { project } from '@/store';
import { MapField, toTickTime, allKeys, Keys } from '@/utils';
import { Left } from 'fp-ts/lib/Either';
import Cache from '@/cache';
import Part from '@/modules/audio/part';
import io from '@/modules/io';
import { Pattern, Score, Project, Note, Instrument } from '@/schemas';

const { dialog } = remote;

const FILTERS = [{ name: 'DAWG Files', extensions: ['dg'] }];

type ACTIONS = 'add';
interface Group {
  action: ACTIONS;
  icon: string;
  tooltip: string;
}

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
    Mixer,
    ActivityBar,
  },
})
export default class App extends Vue {
  @MapField(project, project) public bpm!: number;

  public toolbarHeight = 64;
  public sidebarTabTitle = '';
  public selectedSynth: Tone.PolySynth | null = null;
  public project = project;
  public selectedPattern: Pattern | null = null;
  public selectedScore: Score | null = null;
  public cache: Cache | null = null;
  public tone = Tone.Transport;

  public synthActions: Group[] = [
    {
      action: 'add',
      icon: 'add',
      tooltip: 'Add Instrument',
    },
  ];

  public play = false;
  public part = new Part<Note>();

  public $refs!: {
    tabs: BaseTabs,
    panels: BaseTabs,
  };

  // To populate the activity bar
  public items: SideBar[] = [];
  public panels: Tab[] = [];

  public async mounted() {
    this.items = this.$refs.tabs.$children as SideBar[];
    this.panels = this.$refs.panels.tabs;

    ipcRenderer.on('save', this.save);
    ipcRenderer.on('open', this.open);

    this.cache = await Cache.fromCacheFolder();
    this.$refs.panels.selectTab(this.cache.openedPanel);
    this.$refs.tabs.selectTab(this.cache.openedSideTab);

    this.part.loop = true;
    // this.part.loopStart = '0:2:0';
    // this.part.loopEnd = '1:0:0';

    // this.part.start();
    // this.part.start(1);
    // this.part.loop = true;
    // Tone.Transport.bpm.value = 93;

    window.addEventListener('keypress', this.keydown);
  }

  public destroyed() {
    window.removeEventListener('keypress', this.keydown);
  }

  public keydown(e: KeyboardEvent) {
    if (e.keyCode === Keys.SPACE) {
      e.preventDefault();
      this.playPause();
    }
  }

  get notes() {
    if (!this.selectedScore) { return []; }
    return this.selectedScore.notes;
  }
  get instruments() {
    return this.project.instruments;
  }
  get instrumentLookup() {
    const instruments: {[k: string]: Instrument} = {};
    this.project.instruments.forEach((instrument) => {
      instruments[instrument.name] = instrument;
    });
    return instruments;
  }
  public clickActivityBar(tab: SideBar, $event: MouseEvent) {
    if (this.cache) { this.cache.openedSideTab = tab.name; }
    this.$refs.tabs.selectTab(tab.name, $event);
  }
  public changed(tab: SideBar) {
    this.sidebarTabTitle = tab.name;
  }
  public selectPanel(name: string, e: MouseEvent) {
    if (this.cache) {
      this.cache.openedPanel = name;
    }
    this.$refs.panels.selectTab(name, e);
  }
  get openedFile() {
    if (!this.cache) { return null; }
    return this.cache.openedFile;
  }
  public save() {
    if (!this.cache) { return; }

    if (!this.cache.openedFile) {
      this.cache.openedFile = dialog.showSaveDialog(remote.getCurrentWindow(), {});
      // dialog.showSaveDialog can be null. Return type for showSaveDialog is wrong.
      if (!this.cache.openedFile) { return; }
      if (!this.cache.openedFile.endsWith('.dg')) {
        this.cache.openedFile = this.cache.openedFile + '.dg';
      }
    }

    const encoded = io.serialize(project, Project);
    fs.writeFileSync(
      this.cache.openedFile,
      JSON.stringify(encoded, null, 4),
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

    const result = io.deserialize(contents, Project);
    // TODO No error handling
    // if (result instanceof Left) {
    //   this.$notify.error('Unable to decode file.');
    //   return;
    // }

    project.reset(result);
  }
  public playPattern() {
    this.part.start();
    this.play = true;
  }
  public pausePattern() {
    this.part.pause();
    this.play = false;
  }
  public playPause() {
    if (this.part.state === 'started') {
      this.pausePattern();
    } else {
      this.playPattern();
    }
  }
  public added(note: Note) {
    const time = toTickTime(note.time);
    this.$log.debug(`Adding note at ${note.time} -> ${time}`);
    this.part.add(this.callback, time, note);
  }
  public removed(note: Note, i: number) {
    // const time = toTickTime(note.time);
    this.part.remove(note);
  }
  public callback(time: number, note: Note) {
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

