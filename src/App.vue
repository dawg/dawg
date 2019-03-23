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
          @resize="workspace.setSideBarSize.bind(workspace)"
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
              :transport="transport"
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
              @update:rowHeight="workspace.setPlaylistRowHeight.bind(workspace)"
              :px-per-beat="workspace.playlistBeatWidth"
              @update:pxPerBeat="workspace.setPlaylistBeatWidth.bind(workspace)"
              @new-prototype="checkPrototype"
            ></playlist-sequencer>
            <blank v-else></blank>              
          </split>

          <split
            class="secondary" 
            direction="vertical"
            :style="border('top')"
            keep
            :initial="workspace.panelsSize"
            @resize="workspace.setPanelsSize.bind(workspace)"
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
      <split :initial="20" fixed>
        <status-bar></status-bar>
      </split>
    </split>
    <notifications></notifications>
    <context-menu></context-menu>
    <palette 
      v-model="palette"
      palette-class="secondary"
      :items="paletteCommands"
    ></palette>
    <keyboard-shortcuts :items="paletteCommands"></keyboard-shortcuts>
    <palette 
      v-model="themePalette"
      palette-class="secondary"
      :items="themeCommands"
      automatic
      @cancel="restoreTheme"
    ></palette>
    <project-modal 
      v-model="backupModal" 
      :projects="general.projects"
      @open="openProject"
      @delete="deleteProject"
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
import { cache, general, workspace, Project } from '@/store';
import { toTickTime, allKeys, Keys } from '@/utils';
import Transport from '@/modules/audio/transport';
import { automation } from '@/modules/knobs';
import Sidebar from '@/components/SideBar.vue';
import SideTabs from '@/sections/SideTabs.vue';
import Panels from '@/sections/Panels.vue';
import PanelHeaders from '@/sections/PanelHeaders.vue';
import ActivityBar from '@/sections/ActivityBar.vue';
import StatusBar from '@/sections/StatusBar.vue';
import Tone from 'tone';
import { SideTab, FILTERS, ApplicationContext } from '@/constants';
import { PaletteItem } from '@/modules/palette';
import { Watch } from '@/modules/update';
import backend, { ProjectInfo } from '@/backend';
import * as io from '@/modules/cerialize';
import tmp from 'tmp';
import { remote } from 'electron';
import { Menu } from '@/modules/menubar';
import theme from '@/modules/theme';
import { Theme } from '@/modules/theme/types';
import auth from '@/auth';
import { User } from 'firebase';
import { ScheduledPattern } from '@/core/scheduled/pattern';
import { ScheduledSample } from '@/core/scheduled/sample';
import { Automatable } from '@/core/automation';

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
  public general = general;
  public workspace = workspace;

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
      callback: this.openFolder,
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

  get themeCommands(): PaletteItem[] {
    return Object.entries(theme.defaults).map(([name, theDefault]) => {
      return {
        text: name,
        callback: () => {
          workspace.setTheme(name);
          theme.insertTheme(theDefault);
        },
      };
    });
  }

  public paletteCommands: PaletteItem[] = [
    {
      text: 'Open Piano Roll',
      shortcut: ['Ctrl', 'P'],
      callback: () => workspace.setOpenedPanel('Piano Roll'),
    },
    {
      text: 'Open File Explorer',
      shortcut: ['Ctrl', 'E'],
      callback: () => workspace.setOpenedSideTab('Explorer'),
    },
    {
      text: 'Open Mixer',
      shortcut: ['Ctrl', 'M'],
      callback: () => workspace.setOpenedPanel('Mixer'),
    },
    {
      text: 'New Synthesizer',
      shortcut: ['Ctrl', 'N'],
      callback: () => general.project.addInstrument('Synth'),
    },
    {
      text: 'Play/Pause',
      shortcut: ['Space'],
      callback: this.playPause,
    },
    {
      text: 'Change Theme',
      callback: this.openThemePalette,
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
  public themePalette = false;
  public themeMomento: string | null = null;

  public maximized = false;

  // We need these to be able to keep track of the start and end of the playlist loop
  // for creating automation clips
  public masterStart = 0;
  public masterEnd = 0;

  get getProjectsErrorMessage() {
    return general.getProjectsErrorMessage;
  }

  get transport() {
    if (workspace.applicationContext === 'pianoroll') {
      const pattern = workspace.selectedPattern;
      return pattern ? pattern.transport : null;
    } else {
      return general.project.master.transport;
    }
  }

  get playlistPlay() {
    return general.play && workspace.applicationContext === 'playlist';
  }

  public async created() {
    // This is called before refresh / close
    // I don't remove this listner because the window is closing anyway
    // I'm not even sure onExit would be called if we removed it in the destroy method
    window.addEventListener('beforeunload', this.onExit);

    const w = remote.getCurrentWindow();
    w.addListener('maximize', this.maximize);
    w.addListener('unmaximize', this.unmaximize);

    automation.$on('automate', this.addAutomationClip);

    auth.watchUser({
      authenticated: general.setUser,
      unauthenticated: () => {
        general.setUser(null);
      },
    });

    setTimeout(async () => {
      // Make sure we load the cache first before loading the default project.
      this.$log.debug('Starting to read data.');
      await cache.fromCacheFolder();

      const result = await general.loadProject();
      if (result.type === 'error') {
        this.$notify.info('Unable to load project.', { detail: result.message });
      }

      general.setProject(result.project);
      await workspace.loadSpecific();

      // Log this for debugging purposes
      // tslint:disable-next-line:no-console
      console.info(general.project);

      this.loadTheme(workspace.themeName);

      this.$log.debug('Finished reading data from the fs.');
      this.loaded = true;
    }, 1250);
  }

  public mounted() {
    this.checkMaximize();
  }

  public destroyed() {
    const w = remote.getCurrentWindow();
    w.removeListener('maximize', this.maximize);
    w.removeListener('unmaximize', this.unmaximize);
  }

  public openPalette() {
    this.palette = true;
  }

  public openFolder() {
    // TODO
    // the showFileDialog messes with the keyup events
    // This is a temporary solution
    cache.openFolder();
    this.$shortcuts.clear();
  }

  public openThemePalette() {
    this.themeMomento = workspace.themeName;
    this.themePalette = true;
  }

  public border(side: 'left' | 'right' | 'top' | 'bottom') {
    return `border-${side}: 1px solid ${this.$theme.background}`;
  }

  public loadTheme(themeName: string | null) {
    const isThemeKey = (key: string | null): key is keyof typeof theme.defaults => {
      return !!key && theme.defaults.hasOwnProperty(key);
    };

    if (isThemeKey(themeName)) {
      theme.insertTheme(theme.defaults[themeName]);
    }
  }

  public async onExit() {
    await workspace.write();
  }

  public openBackup() {
    this.handleUnauthenticated(async (user) => {
      this.backupModal = true;
      general.loadProjects(user);
    });
  }

  public restoreTheme() {
    this.loadTheme(this.themeMomento);
  }

  public async open() {
    // files can be undefined. There is an issue with the .d.ts files.
    const files = remote.dialog.showOpenDialog(
      remote.getCurrentWindow(),
      { filters: FILTERS, properties: ['openFile'] },
    );

    // TODO
    // the showFileDialog messes with the keyup events
    // This is a temporary solution
    this.$shortcuts.clear();

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
    if (workspace.backup) {
      general.set({ key: 'syncing', value: true })
    }

    const backupStatus = await general.saveProject({
      backup: workspace.backup,
      user: general.user,
      forceDialog,
    });

    // Always set the value back to false... you never know
    general.set({ key: 'syncing', value: false })

    // backupStatus is true if workspace.backup is also true
    if (backupStatus) {
      switch (backupStatus.type) {
        case 'error':
          this.$notify.error('Unable to backup', { detail: backupStatus.message });
          general.set({ key: 'backupError', value: true });
          break;
        case 'success':
          // Make sure to set it back to false if there was an error previously
          general.set({ key: 'backupError', value: false });
          break;
      }
    }
  }

  public setContext(context: ApplicationContext) {
    workspace.setContext(context);
    general.pause();
  }

  public playPause() {
    let transport: Transport;
    if (workspace.applicationContext === 'pianoroll') {
      const pattern = workspace.selectedPattern;
      if (!pattern) {
        this.$notify.info('Please select a Pattern.', {
          detail: 'Please create and select a Pattern first or switch the Playlist context.',
        });
        return;
      }
      transport = pattern.transport;
    } else {
      transport = general.project.master.transport;
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

  /**
   * Whenever we add a sample, if it hasn't been imported before, add it the the list of project samples.
   */
  public checkPrototype(prototype: ScheduledPattern | ScheduledSample) {
    if (!(prototype instanceof ScheduledSample)) {
      return;
    }

    const sample = prototype.sample;
    if (general.project.samples.indexOf(prototype.sample) >= 0) {
      return;
    }

    this.$log.debug('Adding a sample!');
    general.project.addSample(sample);
  }

  public async addAutomationClip<T extends Automatable>(automatable: T, key: keyof T) {
    const added = await general.project.createAutomationClip({
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
    this.handleUnauthenticated(async (user) => {
      const res = await backend.getProject(user, info.id);
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
    });
  }

  public handleUnauthenticated(authenticated: (user: User) => void) {
    if (general.user === null) {
      // TODO dulication
      this.$notify.info('Please login first', { detail: 'Use the settings icon in the Activity Bar.' });
      return;
    }

    authenticated(general.user);
  }

  public deleteProject(info: ProjectInfo) {
    this.handleUnauthenticated(async (user) => {
      const res = await backend.deleteProject(user, info.id);

      if (res.type === 'success') {
        // We are not taking advantage of firebase here
        // Ideally firebase would send an event and we would update our project list
        // Until we do that, this will suffice
        general.setProjects(
          general.projects.filter((maybe) => maybe !== info),
        );
      } else if (res.type === 'not-found') {
        this.$notify.info(`Unable to delete ${info.name}`, { detail: 'The project was not found.' });
      } else {
        this.$notify.info(`Unable to delete ${info.name}`, { detail: res.message });
      }
    });
  }

  public async newProject() {
    await cache.setOpenedFile(null);
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

.toolbar
  z-index: 10
</style>

