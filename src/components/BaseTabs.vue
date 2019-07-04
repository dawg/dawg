<template>
  <div class="base-tabs">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { makeLookup, Nullable } from '@/utils';
import Tab from '@/components/Tab.vue';
import { Watch } from '@/modules/update';

@Component({components: { Tab }})
export default class BaseTabs extends Vue {
  public tabs: Tab[] = [];
  @Prop(String) public selectedTab?: string;

  get firstTab() {
    return this.tabs[0] || {};
  }

  get tabLookup() {
    return makeLookup(this.tabs, (tab) => tab.name);
  }

  public mounted() {
    this.tabs = [...this.$children as Tab[]];
    this.doSelectTab();
  }

  public selectTab(name?: string | null, event?: MouseEvent) {
    if (event) { event.preventDefault(); }
    if (!name) { return; }
    this.$update('selectedTab', name);
  }

  public close(i: number) {
    this.tabs[i].isActive = false;
    const tab = this.tabs[i + 1] || this.tabs[i - 1] || {};
    this.tabs.splice(i, 1);
    this.selectTab(tab.name);
  }

  @Watch<BaseTabs>('firstTab')
  public checkFirstTab() {
    if (!this.selectedTab && this.firstTab) {
      this.$update('selectedTab', this.firstTab.name);
    }
  }

  @Watch<BaseTabs>('selectedTab')
  public doSelectTab() {
    this.$log.debug(`Tab change -> ${this.selectedTab}`);
    this.tabs.forEach((tab) => {
      tab.isActive = (tab.name === this.selectedTab);
    });
  }
}
</script>


<style lang="sass" scoped>
.base-tabs
  height: 100%
</style>
