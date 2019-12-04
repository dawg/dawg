<template>
  <v-app class="app">
    <split direction="vertical">

      <split direction="horizontal" resizable>
        <split :initial="65" fixed>
          <activity-bar @open-settings="openSettings"></activity-bar>
        </split>

        <split 
          collapsible 
          :min-size="100"
          :initial.sync="base.ui.sideBarSize.value"
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
            :initial.sync="base.ui.panelsSize.value"
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
          <div
            v-for="(item, i) in statusBarLeft"
            class="status-bar-item-left"
            :key="`status-bar-left-${i}`" 
          ><component :is="item.component"></component></div>

          <div style="flex: 1"></div>

          <div
            v-for="(item, i) in statusBarRight"
            class="status-bar-item-right"
            :key="`status-bar-right-${i}`"
          ><component :is="item.component"></component></div>
        </div>

      </split>
    </split>
    <settings v-model="settings"></settings>
    <component
      v-for="(global, i) in base.ui.global"
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
import Panels from '@/components/Panels.vue';
import PanelHeaders from '@/components/PanelHeaders.vue';
import ActivityBar from '@/components/ActivityBar.vue';
import { TOOLBAR_HEIGHT, STATUS_BAR_HEIGHT } from '@/constants';
import * as base from '@/base';
import { sortOrdered } from './utils';
import * as dawg from '@/dawg';

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
  public TOOLBAR_HEIGHT = TOOLBAR_HEIGHT;
  public STATUS_BAR_HEIGHT = STATUS_BAR_HEIGHT;
  public base = base;
  public settings = false;

  // This loaded flag is important
  // Bugs can appear if we render before we load the project file
  // This occurs because some components mutate objects
  // However, they do not reapply their mutations
  // ie. some components expect props to stay the same.
  public loaded = false;

  get mainComponent() {
    if (base.ui.mainSection.length) {
      return base.ui.mainSection[base.ui.mainSection.length - 1];
    }
  }

  get toolbarLeft() {
    return base.ui.toolbar.filter((item) => item.position === 'left').sort(sortOrdered);
  }

  get toolbarRight() {
    return base.ui.toolbar.filter((item) => item.position === 'right').sort(sortOrdered).reverse();
  }

  get iconColor() {
    return base.theme.foreground;
  }

  get lineStyle() {
    return `border-left: 1px solid ${base.theme.foreground}`;
  }

  get statusBarRight() {
    return base.ui.statusBar.filter((item) => item.position === 'right').sort(sortOrdered).reverse();
  }

  get statusBarLeft() {
    return base.ui.statusBar.filter((item) => item.position === 'left').sort(sortOrdered);
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
    window.addEventListener('beforeunload', base.manager.dispose);

    // FIXME
    // automation.$on('automate', this.addAutomationClip);

    setTimeout(async () => {
      // Log this for debugging purposes
      (window as any).base = base;
      (window as any).dawg = dawg;
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
    base.notify.info('Connection has been restored');
  }

  public offline() {
    base.notify.warning('You are disconnected', {
      detail: 'Features may not work as expected.',
    });
  }

  public border(side: 'left' | 'right' | 'top' | 'bottom') {
    return `border-${side}: 1px solid ${base.theme.background}`;
  }

  public openSettings() {
    this.settings = true;
  }

  // public async addAutomationClip<T extends Automatable>(automatable: T, key: keyof T & string) {
    // FIXME Fix automation clips
    // const added = await ddd.project.project.createAutomationClip({
    //   automatable,
    //   key,
    //   start: this.masterStart,
    //   end: this.masterEnd,
    // });

    // if (!added) {
    //   base.notify.warning('Unable to create automation clip', {
    //     detail: 'There are no free tracks. Move elements and try again.',
    //   });
    // }
  // }
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

