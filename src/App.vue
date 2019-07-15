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
          :initial.sync="dawg.sizes.sideBarSize.value"
        >
          <side-tabs 
            v-if="loaded"
            :style="border('right')"
          ></side-tabs>
          <blank v-else></blank>
        </split>

        <split direction="vertical" resizable>
          <split :initial="TOOLBAR_HEIGHT" fixed>
            <v-toolbar 
              class="secondary toolbar" 
              :style="border('bottom')"
              :height="TOOLBAR_HEIGHT" 
            >
              <logo
                :color="iconColor"
              ></logo>

              <div 
                class="tall-line"
                :style="lineStyle"
              ></div>

              <component
                v-for="(item, i) in toolbarLeft"
                :key="`toolbar-left-${i}`"
                :is="item.component"
              ></component>

              <v-spacer
                class="drag-area"
              ></v-spacer>

              <component
                v-for="(item, i) in toolbarRight"
                :key="`toolbar-right-${i}`"
                :is="item.component"
              ></component>
            </v-toolbar>
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
            :initial.sync="dawg.sizes.panelsSize.value"
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
      <split :initial="STATUS_BAR_HEIGHT" fixed>

        <div class="primary footer position foreground--text" :style="statusBarStyle">
          <component
            v-for="(item, i) in statusBarLeft"
            class="status-bar-item-left"
            :key="`status-bar-left-${i}`"
            :is="item.component"
          ></component>

          <div style="flex: 1"></div>

          <component
            v-for="(item, i) in statusBarRight"
            class="status-bar-item-right"
            :key="`status-bar-right-${i}`"
            :is="item.component"
          ></component>
        </div>

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
import { automation } from '@/modules/knobs';
import Panels from '@/dawg/extensions/core/panels/Panels.vue';
import PanelHeaders from '@/dawg/extensions/core/panels/PanelHeaders.vue';
import ActivityBar from '@/dawg/extensions/core/activity-bar/ActivityBar.vue';
import { TOOLBAR_HEIGHT, STATUS_BAR_HEIGHT } from '@/constants';
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
    Panels,
    PanelHeaders,
    ActivityBar,
  },
})
export default class App extends Vue {
  public dawg = dawg;
  public TOOLBAR_HEIGHT = TOOLBAR_HEIGHT;
  public STATUS_BAR_HEIGHT = STATUS_BAR_HEIGHT;

  // This loaded flag is important
  // Bugs can appear if we render before we load the project file
  // This occurs because some components mutate objects
  // However, they do not reapply their mutations
  // ie. some components expect props to stay the same.
  public loaded = false;

  get mainComponent() {
    if (dawg.ui.mainSection.length) {
      return dawg.ui.mainSection[dawg.ui.mainSection.length - 1];
    }
  }

  get toolbarLeft() {
    return dawg.ui.toolbar.filter((item) => item.position === 'left');
  }

  get toolbarRight() {
    return dawg.ui.toolbar.filter((item) => item.position === 'right');
  }

  get iconColor() {
    return dawg.theme.foreground;
  }

  get lineStyle() {
    return `border-left: 1px solid ${dawg.theme.foreground}`;
  }

  get statusBarRight() {
    return dawg.ui.statusBar.filter((item) => item.position === 'right');
  }

  get statusBarLeft() {
    return dawg.ui.statusBar.filter((item) => item.position === 'left');
  }

  get statusBarStyle() {
    return {
      lineHeight: `${STATUS_BAR_HEIGHT}px`,
    };
  }

  public async created() {
    // This is called before refresh / close
    // I don't remove this listner because the window is closing anyway
    // I'm not even sure onExit would be called if we removed it in the destroy method
    window.addEventListener('beforeunload', dawg.manager.dispose);

    automation.$on('automate', this.addAutomationClip);

    setTimeout(async () => {
      // Log this for debugging purposes
      // tslint:disable-next-line:no-console
      console.info(dawg);
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

  public async addAutomationClip<T extends Automatable>(automatable: T, key: keyof T & string) {
    // FIXME Fix automation clips
    // const added = await dawg.project.project.createAutomationClip({
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
html
  overflow: hidden

*
  font-family: monospace

.center--vertial
  display: flex
  flex-direction: column
  justify-content: center
</style>

<style lang="sass" scoped>
.app
  display: flex
  flex-direction: column

.toolbar
  z-index: 10
  border-bottom: 1px solid
  padding: 0
  box-shadow: none

.toolbar /deep/ .v-toolbar__content
  padding: 0 20px

.tall-line
  height: 60% 
  margin: 20px

.footer
  display: flex
  width: 100%
  font-size: 12px
  height: 100%
  text-align: center
  position: unset
  align-items: center

.status-bar-item-left
  margin-left: 15px
  padding-top: 1px

.status-bar-item-right
  margin-right: 15px
  padding-top: 1px
</style>

