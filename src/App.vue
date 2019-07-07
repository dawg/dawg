<template>
  <v-app class="app">
    <split direction="vertical">

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

          <split :initial="TOOLBAR_HEIGHT" fixed>
            <toolbar
              class="toolbar"
              :height="TOOLBAR_HEIGHT"
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
            <component
              v-if="loaded"
              :is="mainComponent"
              style="height: 100%"
            ></component>
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
    <loading 
      class="secondary"
      :value="!loaded"
    ></loading>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { shell } from 'electron';
import { general, workspace, Project } from '@/store';
import { automation } from '@/modules/knobs';
import SideTabs from '@/sections/SideTabs.vue';
import Panels from '@/dawg/extensions/core/panels/Panels.vue';
import PanelHeaders from '@/dawg/extensions/core/panels/PanelHeaders.vue';
import ActivityBar from '@/dawg/extensions/core/activity-bar/ActivityBar.vue';
import StatusBar from '@/sections/StatusBar.vue';
import { SideTab, FILTERS, ApplicationContext, APPLICATION_PATH, RECORDING_PATH, TOOLBAR_HEIGHT } from '@/constants';
import { remote } from 'electron';
import { ScheduledPattern } from '@/core/scheduled/pattern';
import { ScheduledSample, Sample } from '@/core';
import { Automatable } from '@/core/automation';
import * as Audio from '@/modules/audio';
import * as dawg from '@/dawg';
import { Menu } from './dawg/extensions/core/menubar';

// TO VERIFY
// 1. Recording
// 2. Backup
// 3. MIDI
// 4. Remove all dawg references in the extensions folder
// 5. Move all extensions to a single folder and not core/extra

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
  public TOOLBAR_HEIGHT = TOOLBAR_HEIGHT;

  public general = general;
  public workspace = workspace;

  public menuItems: { [key: string]: dawg.Command } = {
    save: {
      text: 'Save',
      shortcut: ['CmdOrCtrl', 'S'],
      callback: this.save,
    },
    saveAs: {
      text: 'Save As',
      shortcut: ['CmdOrCtrl', 'Shift', 'S'],
      callback: () => this.save(true),
    },
    open: {
      text: 'Open',
      shortcut: ['CmdOrCtrl', 'O'],
      callback: this.open,
    },
    new: {
      shortcut: ['CmdOrCtrl', 'N'],
      text: 'New Project',
      callback: this.newProject,
    },
    palette: {
      text: 'Command Palette',
      shortcut: ['CmdOrCtrl', 'Shift', 'P'],
      callback: this.openPalette,
    },
    switchContext: {
      text: 'Switch Context',
      shortcut: ['CmdOrCtrl', 'Tab'],
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
        // TODO(jacob)
        // this.menuItems.reload,
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

  get mainComponent() {
    console.log(dawg.ui.mainSection.length);
    if (dawg.ui.mainSection.length) {
      return dawg.ui.mainSection[dawg.ui.mainSection.length - 1];
    }
  }

  public async created() {
    // This is called before refresh / close
    // I don't remove this listner because the window is closing anyway
    // I'm not even sure onExit would be called if we removed it in the destroy method
    window.addEventListener('beforeunload', this.onExit);

    // TODO(jacob)
    this.paletteCommands.forEach((command) => dawg.commands.registerCommand(command));

    automation.$on('automate', this.addAutomationClip);

    setTimeout(async () => {
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
    dawg.menubar.setMenu(this.menu);

    window.addEventListener('offline', this.offline);
    window.addEventListener('online', this.online);

    // The offline event is not fired if initially disconnected
    if (!navigator.onLine) {
      this.offline();
    }
  }

  public destroyed() {
    const w = remote.getCurrentWindow();

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

  public async addAutomationClip<T extends Automatable>(automatable: T, key: keyof T & string) {
    // TODO(jacob)
    // const added = await general.project.createAutomationClip({
    //   automatable,
    //   key,
    //   start: this.masterStart,
    //   end: this.masterEnd,
    // });

    // if (!added) {
    //   dawg.notify.warning('Unable to create automation clip', {
    //     detail: 'There are no free tracks. Move elements and try again.',
    //   });
    // }
  }

  public async newProject() {
    await dawg.project.removeOpenedFile();
    dawg.window.reload();
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

