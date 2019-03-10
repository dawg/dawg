<template>
  <div class="aside secondary" style="display: flex; flex-direction: column">
    <div
      class="section-header white--text"
      :style="`min-height: ${general.toolbarHeight + 1}px; display: flex; align-items: center`"
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
        :selected-tab="specific.openedSideTab"
        @update:selectedTab="specific.setOpenedSideTab"
      >
        <side-bar :name="tabs.explorer" icon="folder">
          <file-explorer
            :folders="cache.folders"
            @open-explorer="cache.openFolder"
          ></file-explorer>
        </side-bar>
        <side-bar :name="tabs.audioFiles" icon="queue_music">
          <audio-files></audio-files>
        </side-bar>
        <side-bar :name="tabs.patterns" icon="queue_play">
          <patterns 
            :value="specific.selectedPattern" 
            @input="specific.setPattern"
            :patterns="project.patterns"
          ></patterns>
        </side-bar>
      </base-tabs>
    </vue-perfect-scrollbar>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import FileExplorer from '@/components/FileExplorer.vue';
import Patterns from '@/components/Patterns.vue';
import BaseTabs from '@/components/BaseTabs.vue';
import SideBar from '@/components/SideBar.vue';
import AudioFiles from '@/sections/AudioFiles.vue';
import { project, cache, general, specific } from '@/store';
import { Watch } from '@/modules/update';
import { SideTab } from '@/constants';

interface Group {
  icon: string;
  tooltip: string;
  callback: () => void;
}

@Component({
  components: {
    FileExplorer,
    Patterns,
    BaseTabs,
    SideBar,
    AudioFiles,
  },
})
export default class SideTabs extends Vue {
  public project = project;
  public cache = cache;
  public specific = specific;
  public general = general;

  public $refs!: {
    tabs: BaseTabs,
  };

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

  get actions(): Group[] {
    if (specific.openedSideTab === 'Patterns') {
      return this.patternActions;
    } else {
      return [];
    }
  }

  get header() {
    if (specific.openedSideTab) {
      return specific.openedSideTab.toUpperCase();
    }
  }

}
</script>

<style lang="sass" scoped>
.aside
  height: 100%
  width: 100%
  z-index: 3
  border-right: 1px solid

.section-header
  font-size: 15px !important
  border-bottom: 1px solid rgba(0, 0, 0, 0.3)
  padding: 0 20px

.scrollbar >>> .ps__scrollbar-y-rail
  background-color: transparent

.aside--title
  user-select: none
</style>