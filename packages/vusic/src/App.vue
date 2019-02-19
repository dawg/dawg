<template>
  <v-app class="app">
    <dawg>
      <split direction="vertical">
        <split direction="horizontal" resizable>
          <split :initial="65" fixed>
            <activity-bar></activity-bar>
          </split>

          <split :initial="250" collapsible :min-size="100">
            <side-tabs v-if="loaded"></side-tabs>
          </split>

          <split direction="vertical" resizable>

            <split :initial="general.toolbarHeight" fixed>
              <toolbar
                :height="general.toolbarHeight"
                :transport="transport"
                :context="general.applicationContext"
                @update:context="general.setContext"
                :play="general.play"
                @update:play="playPause"
                style="border-bottom: 1px solid rgba(0, 0, 0, 0.3); z-index: 500"
                :bpm="project.bpm"
                @update:bpm="project.setBpm"
              ></toolbar>
            </split>

            <split>
              <playlist-sequencer
                v-if="loaded"
                style="height: 100%"
                :tracks="project.tracks" 
                :elements="project.master.elements"
                :transport="project.master.transport"
                :play="general.playlistPlay"
                :start.sync="masterStart"
                :end.sync="masterEnd"
                @new-prototype="checkPrototype"
              ></playlist-sequencer>
            </split>

            <split class="secondary" direction="vertical" :style="`border-top: 1px solid #111`" keep>
              <split :initial="55" fixed>
                <panel-headers></panel-headers>
              </split>
              <split>
                <panels v-if="loaded"></panels>
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
    <notifications></notifications>
    <context-menu></context-menu>
  </v-app>
</template>

<script lang="ts">
import fs from 'fs';
import { Component, Vue } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';
import { project, cache, general, specific } from '@/store';
import { toTickTime, allKeys, Keys } from '@/utils';
import Transport from '@/modules/audio/transport';
import { automation } from '@/modules/knobs';
import { Pattern, Score, Note, Instrument, PlacedPattern, PlacedSample, Automatable, AutomationClip } from '@/schemas';
import Sidebar from '@/components/SideBar.vue';
import SideTabs from '@/sections/SideTabs.vue';
import Panels from '@/sections/Panels.vue';
import PanelHeaders from '@/sections/PanelHeaders.vue';
import ActivityBar from '@/sections/ActivityBar.vue';
import Tone from 'tone';

@Component({
  components: {
    SideTabs,
    Panels,
    PanelHeaders,
    ActivityBar,
  },
})
export default class App extends Vue {
  public project = project;
  public general = general;
  public specific = specific;

  // This loaded flag is important
  // Bugs can appear if we render before we load the project file
  // This occurs because some components mutate objects
  // However, they do not reapply their mutations
  // ie. some components expect props to stay the same.
  public loaded = false;

  // We need these to be able to keep track of the start and end of the playlist loop
  // for creating automation clips
  public masterStart = 0;
  public masterEnd = 0;

  get openedFile() {
    if (!cache) { return null; }
    return cache.openedFile;
  }

  public async created() {
    window.addEventListener('keypress', this.keydown);
    ipcRenderer.on('save', this.save);
    ipcRenderer.on('open', this.open);
    automation.$on('automate', this.addAutomationClip);

    // tslint:disable-next-line:no-console
    console.info(project);

    // Make sure we load the cache first before loading the default project.
    this.$log.debug('Starting to read data.');
    await cache.fromCacheFolder();
    await this.withErrorHandling(project.load);
    this.$log.debug('Finished reading data from the fs.');
    this.loaded = true;
  }

  public destroyed() {
    window.removeEventListener('keypress', this.keydown);
    ipcRenderer.removeListener('save', project.save);
    ipcRenderer.removeListener('open', this.open);
  }

  public keydown(e: KeyboardEvent) {
    if (e.keyCode === Keys.SPACE) {
      e.preventDefault();
      this.playPause();
    }
  }

  public async withErrorHandling(callback: () => Promise<void>) {
    try {
      await callback();
      await specific.loadSpecific();
    } catch (e) {
      this.$notify.error('Unable to load project.');
      this.$log.error(e);
    }
  }

  public open() {
    this.withErrorHandling(project.open);
  }

  public save() {
    project.save();
    specific.write();
  }

  get transport() {
    if (general.applicationContext === 'pianoroll') {
      const pattern = specific.selectedPattern;
      return pattern ? pattern.transport : null;
    } else {
      return project.master.transport;
    }
  }

  public playPause() {
    let transport: Transport<any>;
    if (general.applicationContext === 'pianoroll') {
      const pattern = specific.selectedPattern;
      if (!pattern) {
        this.$notify.info('Select a pattern.');
        return;
      }
      transport = pattern.transport;
    } else {
      transport = project.master.transport;
    }

    if (transport.state === 'started') {
      this.$log.debug('PAUSING');
      transport.stop();
      general.pause();
    } else {
      this.$log.debug('PLAY');
      transport.start();
      general.start();
    }
  }

  public checkPrototype(prototype: PlacedPattern | PlacedSample) {
    if (!(prototype instanceof PlacedSample)) {
      return;
    }

    const sample = prototype.sample;
    if (sample.id in project.sampleLookup) {
      return;
    }

    this.$log.info('Adding a sample!');
    project.addSample(sample);
  }

  public async addAutomationClip<T extends Automatable>(automatable: T, key: keyof T) {
    const added = await project.createAutomationClip({
      automatable,
      key,
      start: this.masterStart,
      end: this.masterEnd,
    });

    if (!added) {
      this.$notify.warning('Unable to create automation clip', {
        detail: 'There are no free tracks. Move elements and try again.',
      });
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
</style>

