<template>
  <v-app class="app">
    <split direction="vertical">
      <split :initial="30" fixed>
        <menu-bar 
          :menu="menu"
          :maximized="maximized"
          @close="closeApplication"
          @minimize="minimizeApplication"
          @maximize="maximizeApplication"
          @restore="restoreApplication"
        ></menu-bar>
      </split>

      <split direction="horizontal" resizable>
        <split :initial="65" fixed>
          <activity-bar></activity-bar>
        </split>

        <split 
          collapsible 
          :min-size="100"
          :initial="workspace.sideBarSize"
          @resize="workspace.setSideBarSize"
        >
          <side-tabs 
            v-if="loaded"
            :style="border('right')"
          ></side-tabs>
          <blank v-else></blank>
        </split>

        <split direction="vertical" resizable>

          <split :initial="general.toolbarHeight" fixed>
            <toolbar
              class="toolbar"
              :height="general.toolbarHeight"
              :transport="workspace.transport"
              :context="workspace.applicationContext"
              @update:context="setContext"
              :play="general.play"
              @update:play="playPause"
              :style="border('bottom')"
              :bpm="general.project.bpm"
              @update:bpm="(bpm) => general.project.setBpm(bpm)"
            ></toolbar>
          </split>

          <split>
            <playlist-sequencer
              v-if="loaded"
              style="height: 100%"
              :tracks="general.project.tracks" 
              :elements="general.project.master.elements"
              :transport="general.project.master.transport"
              :play="playlistPlay"
              :start.sync="masterStart"
              :end.sync="masterEnd"
              :steps-per-beat="general.project.stepsPerBeat"
              :beats-per-measure="general.project.beatsPerMeasure"
              :row-height="workspace.playlistRowHeight"
              @update:rowHeight="workspace.setPlaylistRowHeight"
              :px-per-beat="workspace.playlistBeatWidth"
              @update:pxPerBeat="workspace.setPlaylistBeatWidth"
              @new-prototype="checkPrototype"
              :is-recording="general.isRecordingMicrophone"
              :ghosts="ghosts"
            ></playlist-sequencer>
            <blank v-else></blank>              
          </split>

          <split
            class="secondary" 
            direction="vertical"
            :style="border('top')"
            keep
            :initial="workspace.panelsSize"
            @resize="workspace.setPanelsSize"
          >
            <split :initial="55" fixed>
              <panel-headers></panel-headers>
            </split>
            <split>
              <panels v-if="loaded"></panels>
              <blank v-else></blank>
            </split>
          </split>
        </split>
      </split>
      <split :initial="25" fixed>
        <status-bar :height="25"></status-bar>
      </split>
    </split>
    <component
      v-for="(global, i) in dawg.ui.global"
      :key="i"
      :is="global"
    ></component>
    <context-menu></context-menu>
    <loading 
      class="secondary"
      :value="!loaded"
    ></loading>
  </v-app>
</template>

<script lang="ts">
import fs from '@/wrappers/fs';
import { Component, Vue } from 'vue-property-decorator';
import { shell, Event, DesktopCapturer, desktopCapturer } from 'electron';
import { general, workspace, Project } from '@/store';
import { toTickTime, allKeys, Keys } from '@/utils';
import Transport from '@/modules/audio/transport';
import { automation } from '@/modules/knobs';
import Sidebar from '@/components/SideBar.vue';
import SideTabs from '@/sections/SideTabs.vue';
import Panels from '@/dawg/extensions/core/panels/Panels.vue';
import PanelHeaders from '@/dawg/extensions/core/panels/PanelHeaders.vue';
import ActivityBar from '@/dawg/extensions/core/activity-bar/ActivityBar.vue';
import StatusBar from '@/sections/StatusBar.vue';
import Tone from 'tone';
import { SideTab, FILTERS, ApplicationContext, APPLICATION_PATH, RECORDING_PATH } from '@/constants';
import { Watch } from '@/modules/update';
import backend, { ProjectInfo } from '@/backend';
import * as io from '@/modules/cerialize';
import { remote } from 'electron';
import { Menu } from '@/modules/menubar';
import { User } from 'firebase';
import { ScheduledPattern } from '@/core/scheduled/pattern';
import { ScheduledSample, Sample } from '@/core';
import { Automatable } from '@/core/automation';
import * as Audio from '@/modules/audio';
import { Ghost, ChunkGhost } from '@/core/ghosts/ghost';
import audioBufferToWav from 'audiobuffer-to-wav';
import path from 'path';
import * as dawg from '@/dawg';

// TO VERIFY
// 1. Recording
// 2. Backup

@Component({
  components: {
    SideTabs,
    Panels,
    PanelHeaders,
    ActivityBar,
    StatusBar,
  },
})
export default class App extends Vue {
  public dawg = dawg;

  get playlistPlay() {
    return general.play && workspace.applicationContext === 'playlist';
  }

  public general = general;
  public workspace = workspace;
  public ghosts: Ghost[] = [];

  public menuItems: { [key: string]: dawg.Command } = {
    save: {
      text: 'Save',
      shortcut: ['Ctrl', 'S'],
      callback: this.save,
    },
    saveAs: {
      text: 'Save As',
      shortcut: ['Ctrl', 'Shift', 'S'],
      callback: () => this.save(true),
    },
    open: {
      text: 'Open',
      shortcut: ['Ctrl', 'O'],
      callback: this.open,
    },
    closeApplication: {
      text: 'Close Application',
      shortcut: ['Ctrl', 'W'],
      callback: this.closeApplication,
    },
    new: {
      shortcut: ['Ctrl', 'N'],
      text: 'New Project',
      callback: this.newProject,
    },
    reload: {
      text: 'Reload',
      shortcut: ['Ctrl', 'R'],
      callback: this.reload,
    },
    palette: {
      text: 'Command Palette',
      shortcut: ['Ctrl', 'Shift', 'P'],
      callback: this.openPalette,
    },
    switchContext: {
      text: 'Switch Context',
      shortcut: ['Ctrl', 'Tab'],
      callback: () => {
        if (workspace.applicationContext === 'pianoroll') {
          this.setContext('playlist');
        } else {
          this.setContext('pianoroll');
        }
      },
    },
  };

  public menu: Menu = [
    {
      name: 'File',
      items: [
        this.menuItems.new,
        null,
        this.menuItems.open,
        this.menuItems.backup,
        null,
        // TODO(jacob)
        // this.menuItems.addFolder,
        null,
        this.menuItems.save,
        this.menuItems.saveAs,
      ],
    },
    {
      name: 'View',
      items: [
        this.menuItems.palette,
        this.menuItems.reload,
      ],
    },
    {
      name: 'Help',
      items: [
        {
          text: 'Guide',
          callback: () => {
            shell.openExternal('https://dawg.github.io/guide');
          },
        },
        {
          text: 'Report an Issue',
          callback: () => {
            shell.openExternal('https://github.com/dawg/vusic/issues');
          },
        },
        {
          text: 'Trello Board',
          callback: () => {
            shell.openExternal('https://trello.com/b/ZOLQJGSv/vusic-feature-requests');
          },
        },
        null,
        {
          text: 'Open Developer Tools',
          callback: () => {
            const window = remote.getCurrentWindow();
            window.webContents.openDevTools();
          },
        },
      ],
    },
  ];

  // TODO(jacob)
  public paletteCommands: dawg.Command[] = [
    {
      text: 'Open Piano Roll',
      shortcut: ['Ctrl', 'P'],
      callback: () => {
        dawg.panels.openedPanel.value = 'Piano Roll';
      },
    },
    {
      text: 'Open Mixer',
      shortcut: ['Ctrl', 'M'],
      callback: () => {
        dawg.panels.openedPanel.value = 'Mixer';
      },
    },
    {
      text: 'Play/Pause',
      shortcut: ['Space'],
      callback: this.playPause,
    },
    ...Object.values(this.menuItems),
  ];

  // This loaded flag is important
  // Bugs can appear if we render before we load the project file
  // This occurs because some components mutate objects
  // However, they do not reapply their mutations
  // ie. some components expect props to stay the same.
  public loaded = false;

  // TODO REMOVE
  public backupModal = false;

  public maximized = false;

  // We need these to be able to keep track of the start and end of the playlist loop
  // for creating automation clips
  public masterStart = 0;
  public masterEnd = 0;

  public async created() {
    // This is called before refresh / close
    // I don't remove this listner because the window is closing anyway
    // I'm not even sure onExit would be called if we removed it in the destroy method
    window.addEventListener('beforeunload', this.onExit);

    // TODO(jacob)
    this.paletteCommands.forEach((command) => dawg.commands.registerCommand(command));

    const w = remote.getCurrentWindow();
    w.addListener('maximize', this.maximize);
    w.addListener('unmaximize', this.unmaximize);

    automation.$on('automate', this.addAutomationClip);

    setTimeout(async () => {
      // Make sure we load the cache first before loading the default project.
      this.$log.debug('Starting to read data.');

      // tslint:disable-next-line:no-console
      console.log(dawg);

      // TODO(jacob)
      // const result = await general.loadProject();
      // if (result.type === 'error') {
      //   dawg.notify.info('Unable to load project.', { detail: result.message, duration: Infinity });
      // }

      // general.setProject(result.project);

      // await workspace.loadSpecific();

      // Log this for debugging purposes
      // tslint:disable-next-line:no-console
      console.info(general.project);

      this.$log.debug('Finished reading data from the fs.');
      this.loaded = true;
    }, 1250);
  }

  public mounted() {
    this.checkMaximize();

    window.addEventListener('offline', this.offline);
    window.addEventListener('online', this.online);

    // The offline event is not fired if initially disconnected
    if (!navigator.onLine) {
      this.offline();
    }
  }

  public destroyed() {
    const w = remote.getCurrentWindow();
    w.removeListener('maximize', this.maximize);
    w.removeListener('unmaximize', this.unmaximize);

    window.removeEventListener('offline', this.offline);
    window.removeEventListener('online', this.online);
  }

  public online() {
    // Ok so this delay exists because we can still get connection errors even once we get back online
    // 8000 was just a random number, but it works. It's probably longer than necessary
    setTimeout(() => {
      general.project.instruments.forEach((instrument) => {
        dawg.notify.info('Connection has been restored');
        instrument.online();
      });
    }, 8000);
  }

  public offline() {
    dawg.notify.warning('You are disconnected', {
      detail: 'Soundfonts and cloud syncing will not work as expected.',
      duration: 20000,
    });
  }

  public openPalette() {
    dawg.palette.selectFromItems(dawg.commands.getItems(), {
      onDidSelect: (item) => {
        item.callback();
      },
    });
  }

  public border(side: 'left' | 'right' | 'top' | 'bottom') {
    return `border-${side}: 1px solid ${dawg.theme.background}`;
  }

  public async onExit() {
    // If we don't have a file open, don't write the workspace information
    if (!general.projectPath) {
      return;
    }

    await workspace.write();
  }

  public async open() {
    // files can be undefined. There is an issue with the .d.ts files.
    const files = remote.dialog.showOpenDialog(
      remote.getCurrentWindow(),
      { filters: FILTERS, properties: ['openFile'] },
    );

    // TODO(jacob)
    // the showFileDialog messes with the keyup events
    // This is a temporary solution
    dawg.commands.clear();

    if (!files) {
      return;
    }

    const filePath = files[0];
    await dawg.project.setOpenedFile(filePath);
    const window = remote.getCurrentWindow();
    window.reload();
  }

  public async save(forceDialog: boolean = false) {
    await dawg.project.saveProject({
      forceDialog,
    });
  }

  public setContext(context: ApplicationContext) {
    workspace.setContext(context);
    general.pause();
  }

  public playPause() {
    if (!workspace.transport) {
      dawg.notify.warning('Please select a Pattern.', {
        detail: 'Please create and select a Pattern first or switch the Playlist context.',
      });
      return;
    }

    // TODO(jacob) refactor
    if (workspace.transport.state === 'started') {
      this.$log.debug('PAUSING');
      workspace.transport.stop();
      general.pause();
    } else {
      this.$log.debug('PLAY');
      workspace.transport.start();
      general.start();
    }
  }

  /**
   * Whenever we add a sample, if it hasn't been imported before, add it the the list of project samples.
   */
  public checkPrototype(prototype: ScheduledPattern | ScheduledSample) {
    if (prototype.component !== 'sample-element') {
      return;
    }

    const sample = prototype.sample;
    if (general.project.samples.indexOf(prototype.sample) >= 0) {
      return;
    }

    this.$log.debug('Adding a sample!');
    general.project.addSample(sample);
  }

  public async addAutomationClip<T extends Automatable>(automatable: T, key: keyof T & string) {
    const added = await general.project.createAutomationClip({
      automatable,
      key,
      start: this.masterStart,
      end: this.masterEnd,
    });

    if (!added) {
      dawg.notify.warning('Unable to create automation clip', {
        detail: 'There are no free tracks. Move elements and try again.',
      });
    }
  }

  public async newProject() {
    await dawg.project.removeOpenedFile();
    this.reload();
  }

  public reload() {
    const window = remote.getCurrentWindow();
    window.reload();
  }

  public closeApplication() {
    const window = remote.getCurrentWindow();
    window.close();
  }

  public minimizeApplication() {
    const window = remote.getCurrentWindow();
    window.minimize();
  }

  public maximizeApplication() {
    const window = remote.getCurrentWindow();
    window.maximize();
  }

  public restoreApplication() {
    const window = remote.getCurrentWindow();
    window.restore();
  }

  public checkMaximize() {
    this.maximized = remote.getCurrentWindow().isMaximized();
  }

  public maximize() {
    this.maximized = true;
  }

  public unmaximize() {
    this.maximized = false;
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

.toolbar
  z-index: 10
</style>

