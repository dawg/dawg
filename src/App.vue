<template>
  <v-app class="app">
    <dawg>
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

          <split :initial="250" collapsible :min-size="100">
            <side-tabs v-if="loaded"></side-tabs>
            <blank v-else></blank>
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
              <blank v-else></blank>              
            </split>

            <split class="secondary" direction="vertical" :style="`border-top: 1px solid #111`" keep>
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
        <split :initial="20" fixed>
          <status-bar></status-bar>
        </split>
      </split>
    </dawg>
    <notifications></notifications>
    <context-menu></context-menu>
    <palette 
      v-model="palette"
      palette-class="secondary"
      :items="shortcuts"
    ></palette>
    <project-modal 
      v-model="backupModal" 
      :projects="general.projects"
      @open="openProject"
    ></project-modal>
    <loading 
      class="secondary"
      :value="!loaded"
    ></loading>
  </v-app>
</template>

<script lang="ts">
import fs from 'fs';
import { Component, Vue } from 'vue-property-decorator';
import { shell } from 'electron';
import { project, cache, general, specific, Project } from '@/store';
import { toTickTime, allKeys, Keys } from '@/utils';
import Transport from '@/modules/audio/transport';
import { automation } from '@/modules/knobs';
import { Pattern, Score, Note, Instrument, PlacedPattern, PlacedSample, Automatable, AutomationClip } from '@/schemas';
import Sidebar from '@/components/SideBar.vue';
import SideTabs from '@/sections/SideTabs.vue';
import Panels from '@/sections/Panels.vue';
import PanelHeaders from '@/sections/PanelHeaders.vue';
import ActivityBar from '@/sections/ActivityBar.vue';
import StatusBar from '@/sections/StatusBar.vue';
import Tone from 'tone';
import { SideTab, FILTERS } from '@/constants';
import { PaletteItem, bus } from '@/modules/palette';
import { Watch } from '@/modules/update';
import backend, { ProjectInfo } from '@/backend';
import * as io from '@/modules/cerialize';
import tmp from 'tmp';
import { remote } from 'electron';
import { Menu } from '@/modules/menubar';

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
  public project = project;
  public general = general;
  public specific = specific;

  public menuItems: {[k: string]: PaletteItem} = {
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
    backup: {
      text: 'Open From Backup',
      callback: this.openBackup,
    },
    addFolder: {
      text: 'Add Folder to Workspace',
      callback: cache.openFolder,
    },
    closeApplication: {
      text: 'Close Application',
      shortcut: ['Ctrl', 'W'],
      callback: this.closeApplication,
    },
    copy: {
      text: 'Copy',
      shortcut: ['Ctrl', 'C'],
      callback: () => {
        //
      },
    },
    paste: {
      text: 'Past',
      shortcut: ['Ctrl', 'P'],
      callback: () => {
        //
      },
    },
    cut: {
      shortcut: ['Ctrl', 'X'],
      text: 'Cut',
      callback: () => {
        //
      },
    },
    delete: {
      shortcut: ['Del'],
      text: 'Delete',
      callback: () => {
        //
      },
    },
    reload: {
      text: 'Reload',
      shortcut: ['Ctrl', 'R'],
      callback: () => {
        const window = remote.getCurrentWindow();
        window.reload();
      },
    },
    palette: {
      text: 'Command Palette',
      shortcut: ['Ctrl', 'Shift', 'P'],
      callback: () => {
        bus.$emit('open');
        this.palette = true;
      },
    },
    switchContext: {
      text: 'Switch Context',
      shortcut: ['Ctrl', 'Tab'],
      callback: () => {
        if (general.applicationContext === 'pianoroll') {
          general.setContext('playlist');
        } else {
          general.setContext('pianoroll');
        }
      },
    },
  };

  public menu: Menu = [
    {
      name: 'File',
      items: [
        this.menuItems.open,
        this.menuItems.backup,
        null,
        this.menuItems.addFolder,
        null,
        this.menuItems.save,
        this.menuItems.saveAs,
      ],
    },
    {
      name: 'Edit',
      items: [
        this.menuItems.cut,
        this.menuItems.copy,
        this.menuItems.paste,
        this.menuItems.delete,
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

  public shortcuts: PaletteItem[] = [
    {
      text: 'Open Piano Roll',
      shortcut: ['Ctrl', 'P'],
      callback: () => specific.setOpenedPanel('Piano Roll'),
    },
    {
      text: 'Open File Explorer',
      shortcut: ['Ctrl', 'E'],
      callback: () => specific.setOpenedSideTab('Explorer'),
    },
    {
      text: 'Open Mixer',
      shortcut: ['Ctrl', 'M'],
      callback: () => specific.setOpenedPanel('Mixer'),
    },
    {
      text: 'New Synthesizer',
      shortcut: ['Ctrl', 'N'],
      callback: project.addInstrument, // TODO missing when clause
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

  public backupModal = false;
  public palette = false;

  public maximized = false;

  // We need these to be able to keep track of the start and end of the playlist loop
  // for creating automation clips
  public masterStart = 0;
  public masterEnd = 0;

  get getProjectsErrorMessage() {
    return general.getProjectsErrorMessage;
  }

  public async created() {
    const window = remote.getCurrentWindow();
    window.addListener('maximize', this.maximize);
    window.addListener('unmaximize', this.unmaximize);

    automation.$on('automate', this.addAutomationClip);
    // tslint:disable-next-line:no-console
    console.info(project);

    setTimeout(async () => {
      // Make sure we load the cache first before loading the default project.
      this.$log.debug('Starting to read data.');
      await cache.fromCacheFolder();
      await this.withErrorHandling(project.load);
      this.$log.debug('Finished reading data from the fs.');
      this.loaded = true;
    }, 500);
  }

  public mounted() {
    this.checkMaximize();
  }

  public destroyed() {
    const window = remote.getCurrentWindow();
    window.removeListener('maximize', this.maximize);
    window.removeListener('unmaximize', this.unmaximize);
  }

  public openBackup() {
    this.backupModal = true;

    if (!general.projects.length) {
      general.loadProjects();
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

  public async open() {
    // files can be undefined. There is an issue with the .d.ts files.
    const files = remote.dialog.showOpenDialog(
      remote.getCurrentWindow(),
      { filters: FILTERS, properties: ['openFile'] },
    );

    if (!files) {
      return;
    }

    const filePath = files[0];
    await cache.setOpenedFile(filePath);
    const window = remote.getCurrentWindow();
    window.reload();
  }

  public async save(forceDialog: boolean = false) {
    // If we are backing up, star the progress circle!
    if (specific.backup) {
      general.set({ key: 'syncing', value: true });
    }

    const backupStatus = await project.save({ backup: specific.backup, forceDialog });

    // Always set the value back to false... you never know
    general.set({ key: 'syncing', value: false });

    // backupStatus is true if specific.backup is also true
    if (backupStatus) {
      switch (backupStatus.type) {
        case 'error':
          this.$notify.error('Unable to backup', { detail: backupStatus.message });
          general.set({ key: 'backupError', value: true });
          break;
        case 'success':
          // Make sure to set it back to false if there was an error previously
          if (general.backupError) {
            general.set({ key: 'backupError', value: false });
          }
          break;
      }
    }
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
        this.$notify.info('Please a pattern.', {
          detail: 'You haven\'t told me what to play yet.',
        });
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

  public async openProject(info: ProjectInfo) {
    const res = await backend.getProject(info.id);
    if (res.type === 'not-found') {
      this.$notify.warning('Uh, we were unable to find project');
      return;
    }

    if (res.type === 'error') {
      this.$notify.error('Unable to get project', { detail: res.message });
      return;
    }


    const { name } = tmp.fileSync({ keep: true });
    fs.writeFileSync(name, JSON.stringify(res.project, null, 4));

    if (!fs.existsSync(name)) {
      throw Error(name);
    }

    this.$log.info(`Writing ${name} as backup`);
    cache.setBackupTempPath(name);

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

  @Watch<App>('getProjectsErrorMessage')
  public showNotification() {
    if (this.getProjectsErrorMessage) {
      this.$notify.error('Unable to get projects.', { detail: this.getProjectsErrorMessage });
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

