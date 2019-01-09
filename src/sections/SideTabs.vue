<template>
  <div class="aside secondary" style="display: flex; flex-direction: column">
    <div
      class="section-header center--vertial white--text"
      :style="`min-height: ${general.toolbarHeight + 1}px`"
    >
      <div class="aside--title">{{ sidebarTabTitle }}</div>
    </div>
    <vue-perfect-scrollbar class="scrollbar" style="height: 100%">
      <base-tabs ref="tabs" @changed="changed">
        <side-bar name="EXPLORER" icon="folder">
          <file-explorer
            :folders.sync="cache.folders"
          ></file-explorer>
        </side-bar>
        <side-bar name="AUDIO FILES" icon="queue_music"></side-bar>
        <side-bar name="PATTERNS" icon="queue_play">
          <!-- TODO(jacob) -->
          <patterns 
            :value="specific.selectedPattern" 
            @input="specific.setPattern"
            :patterns="project.patterns"
          ></patterns>
        </side-bar>
        <side-bar name="SEARCH" icon="search"></side-bar>
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
  public sidebarTabTitle = '';
  public items: SideBar[] = [];
  public $refs!: {
    tabs: BaseTabs,
  };

  public mounted() {
    this.items = this.$refs.tabs.$children as SideBar[];
    this.$refs.tabs.selectTab(cache.openedSideTab);
  }

  public changed(tab: SideBar) {
    this.sidebarTabTitle = tab.name;
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