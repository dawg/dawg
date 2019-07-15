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

@Component
export default class BaseTabs extends Vue {
  @Prop(String) public selectedTab?: string;

  public $children!: Tab[];

  get firstTab() {
    return this.$children[0] || {};
  }

  get tabLookup() {
    return makeLookup(this.$children, (tab) => tab.name);
  }

  public selectTab(name?: string | null, event?: MouseEvent) {
    if (event) { event.preventDefault(); }
    if (!name) { return; }
    this.$update('selectedTab', name);
  }

  public close(i: number) {
    const tab = this.$children[i + 1] || this.$children[i - 1] || {};
    this.$children.splice(i, 1);
    this.selectTab(tab.name);
  }

  @Watch<BaseTabs>('firstTab')
  public checkFirstTab() {
    if (!this.selectedTab && this.firstTab) {
      this.$update('selectedTab', this.firstTab.name);
    }
  }
}
</script>


<style lang="sass" scoped>
.base-tabs
  height: 100%
</style>
