<template>
  <v-app 
    class="app" 
  >
    <dawg>
      <split direction="vertical">
        <split direction="horizontal" resizable>
          <split :initial="65" fixed>
            <activity-bar :items="general.sideBarTabs" @click="clickActivityBar"></activity-bar>
          </split>

          <split :initial="250" collapsible :min-size="100">
            <side-tabs v-if="loaded"></side-tabs>
          </split>

          <split direction="vertical" resizable>

            <split :initial="general.toolbarHeight" fixed>
              <toolbar 
                :height="general.toolbarHeight" 
                style="padding-right: 26px; border-bottom: 1px solid rgba(0, 0, 0, 0.3); z-index: 500"
                :bpm="project.bpm"
                @update:bpm="project.setBpm"
              ></toolbar>
            </split>

            <split>
              <tabs 
                :style="`height: 100%`" 
                :selected-tab="specific.openedTab"
                @update:selected-tab="specific.setTab"
              >
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
import Toolbar from '@/components/Toolbar.vue';
import SideBar from '@/components/SideBar.vue';
import Foot from '@/components/Foot.vue';
import FileExplorer from '@/components/FileExplorer.vue';
import ActivityBar from '@/components/ActivityBar.vue';
import PanelHeaders from '@/sections/PanelHeaders.vue';
import Panels from '@/sections/Panels.vue';
import Tabs from '@/components/Tabs.vue';
import Tab from '@/components/Tab.vue';
import Split from '@/modules/split/Split.vue';
import BaseTabs from '@/components/BaseTabs.vue';
import Dawg from '@/components/Dawg.vue';
import SideTabs from '@/sections/SideTabs.vue';
import Notifications from '@/modules/notification/Notifications.vue';
import { ipcRenderer } from 'electron';
import { project, cache, general, specific } from '@/store';
import { toTickTime, allKeys, Keys } from '@/utils';
import Part from '@/modules/audio/part';
import io from '@/modules/io';
import { Pattern, Score, Note, Instrument } from '@/schemas';


@Component({
  components: {
    SideBar,
    Toolbar,
    Tabs,
    Tab,
    Foot,
    Split,
    BaseTabs,
    Dawg,
    Notifications,
    Panels,
    ActivityBar,
    SideTabs,
    PanelHeaders,
  },
})
export default class App extends Vue {
  public project = project;
  public general = general;
  public specific = specific;
  public loaded = false;

  get openedFile() {
    if (!cache) { return null; }
    return cache.openedFile;
  }

  public async created() {
    window.addEventListener('keypress', this.keydown);
    ipcRenderer.on('save', this.save);
    ipcRenderer.on('open', this.open);

    // tslint:disable-next-line:no-console
    console.log(project);

    // Make sure we load the cache first before loading the default project.
    this.$log.info('Starting to read data.');
    await cache.fromCacheFolder();
    await this.withErrorHandling(project.load);
    this.$log.info('Finished reading data from the fs.');
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

  public clickActivityBar(tab: SideBar, $event: MouseEvent) {
    specific.setOpenedSideTab(tab.name);
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

  public playPause() {
    const pattern = specific.selectedPattern;
    if (!pattern) {
      this.$notify.info('Select a pattern.');
      return;
    }

    if (pattern.part.state === 'started') {
      pattern.part.pause();
      general.pause();
    } else {
      pattern.part.start();
      general.start();
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

