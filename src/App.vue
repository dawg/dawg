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
import { FILTERS, ApplicationContext, TOOLBAR_HEIGHT } from '@/constants';
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

  public paletteCommands: dawg.Command[] = Object.values(this.menuItems);

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
    window.addEventListener('beforeunload', dawg.manager.dispose);

    // TODO(jacob)
    this.paletteCommands.forEach((command) => dawg.commands.registerCommand(command));

    automation.$on('automate', this.addAutomationClip);

    setTimeout(async () => {
      // Log this for debugging purposes
      // tslint:disable-next-line:no-console
      console.log(dawg);
      this.loaded = true;
    }, 1250);
  }

  public mounted() {
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
    dawg.notify.info('Connection has been restored');
  }

  public offline() {
    dawg.notify.warning('You are disconnected', {
      detail: 'Features may not work as expected.',
    });
  }

  public border(side: 'left' | 'right' | 'top' | 'bottom') {
    return `border-${side}: 1px solid ${dawg.theme.background}`;
  }

  public setContext(context: ApplicationContext) {
    workspace.setContext(context);
    general.pause();
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

