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
  @Prop(String) public first?: string;

  public $children!: Tab[];

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

  @Watch<BaseTabs>('first')
  public checkFirstTab() {
    if (!this.selectedTab && this.first) {
      this.$update('selectedTab', this.first);
    }
  }
}
</script>


<style lang="sass" scoped>
.base-tabs
  height: 100%
</style>
