<template>
  <div class="aside secondary" style="display: flex; flex-direction: column">
    <div
      class="section-header foreground--text"
      :style="headerStyle"
    >
      <div class="aside--title">{{ header }}</div>
      <div style="flex-grow: 1"></div>
      <tooltip-icon
        v-for="action in actions"
        :key="action.icon"
        :tooltip="action.tooltip"
        bottom
        @click.native="action.callback"
      >
        {{ action.icon }}
      </tooltip-icon>
    </div>
    <vue-perfect-scrollbar class="scrollbar" style="height: 100%">
      <base-tabs
        ref="tabs"
        :selected-tab="workspace.openedSideTab"
        @update:selectedTab="workspace.setOpenedSideTab"
      >
        <side-bar :name="tabs.explorer" icon="folder">
          <smart-file-explorer
            :folders="cache.folders"
            @open-explorer="openFolder"
          ></smart-file-explorer>
        </side-bar>
        <side-bar :name="tabs.audioFiles" icon="queue_music">
          <audio-files></audio-files>
        </side-bar>
        <side-bar :name="tabs.patterns" icon="queue_play">
          <patterns 
            :value="workspace.selectedPattern" 
            @input="workspace.setPattern"
            :patterns="project.patterns"
            @remove="project.removePattern"
          ></patterns>
        </side-bar>
      </base-tabs>
    </vue-perfect-scrollbar>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import Patterns from '@/components/Patterns.vue';
import BaseTabs from '@/components/BaseTabs.vue';
import SideBar from '@/components/SideBar.vue';
import AudioFiles from '@/sections/AudioFiles.vue';
import { project, cache, general, workspace } from '@/store';
import { Watch } from '@/modules/update';
import { SideTab } from '@/constants';
import SmartFileExplorer from '@/smart/SmartFileExplorer.vue';

interface Group {
  icon: string;
  tooltip: string;
  callback: () => void;
}

@Component({
  components: {
    Patterns,
    BaseTabs,
    SideBar,
    AudioFiles,
    SmartFileExplorer,
  },
})
export default class SideTabs extends Vue {
  public project = project;
  public cache = cache;
  public workspace = workspace;
  public general = general;

  public $refs!: {
    tabs: BaseTabs,
  };

  get headerStyle() {
    return {
      borderBottom: `1px solid ${this.$theme.background}`,
      minHeight: `${general.toolbarHeight + 1}px`,
      display: 'flex',
      alignItems: 'center',
    };
  }

  public patternActions: Group[] = [
    {
      icon: 'add',
      tooltip: 'Add Pattern',
      callback: project.addPattern,
    },
  ];



  // For typing reasons
  // Vue will give a compilation error if we use a wrong key
  public tabs: { [k: string]: SideTab } = {
    explorer: 'Explorer',
    audioFiles: 'Audio Files',
    patterns: 'Patterns',
  };

  public mounted() {
    general.setSideBarTabs(this.$refs.tabs.$children as SideBar[]);
  }

  public openFolder() {
    // the showFileDialog messes with the keyup events
    // This is a temporary solution
    cache.openFolder();
    this.$shortcuts.clear();
  }

  get actions(): Group[] {
    if (workspace.openedSideTab === 'Patterns') {
      return this.patternActions;
    } else {
      return [];
    }
  }

  get header() {
    if (workspace.openedSideTab) {
      return workspace.openedSideTab.toUpperCase();
    }
  }

}
</script>

<style lang="sass" scoped>
.aside
  height: 100%
  width: 100%
  z-index: 3

.section-header
  font-size: 15px !important
  padding: 0 20px

.scrollbar >>> .ps__scrollbar-y-rail
  background-color: transparent

.aside--title
  user-select: none
</style>