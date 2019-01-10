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
        @click="action.callback"
      >
        {{ action.icon }}
      </tooltip-icon>
    </div>
    <vue-perfect-scrollbar class="scrollbar" style="height: 100%">
      <base-tabs
        ref="tabs"
        :selected-tab="specific.openedSideTab"
        @update:selected-tab="specific.setOpenedSideTab"
      >
        <side-bar name="Explorer" icon="folder">
          <file-explorer
            :folders.sync="cache.folders"
          ></file-explorer>
        </side-bar>
        <side-bar name="Audio Files" icon="queue_music"></side-bar>
        <side-bar name="Patterns" icon="queue_play">
          <!-- TODO(jacob) -->
          <patterns 
            :value="specific.selectedPattern" 
            @input="specific.setPattern"
            :patterns="project.patterns"
          ></patterns>
        </side-bar>
        <side-bar name="Search" icon="search"></side-bar>
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
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { project, cache, general, specific } from '@/store';
import { Watch } from '@/modules/update';

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
    VuePerfectScrollbar,
    SideBar,
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

  public mounted() {
    general.setSideBarTabs(this.$refs.tabs.$children as SideBar[]);
  }

  get actions(): Group[] {
    // TODO No typing
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