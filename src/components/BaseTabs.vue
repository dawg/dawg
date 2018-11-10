<template>
  <div>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { makeLookup } from '@/utils';
import Tab from '@/components/Tab.vue';

@Component({components: { Tab }})
export default class Tabs extends Vue {
  public tabs: Tab[] = [];

  get firstTab() {
    return this.tabs[0] || {};
  }
  get tabLookup() {
    return makeLookup(this.tabs, (tab) => tab.name);
  }
  public mounted() {
    this.tabs = [...this.$children as Tab[]];
    this.selectTab(this.firstTab.name);
  }
  public selectTab(name?: string, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
    }

    if (!name) {
      return;
    }

    const selectedTab = this.tabLookup[name];
    this.tabs.forEach((tab) => {
      tab.isActive = (tab.name === selectedTab.name);
    });

    this.$emit('changed', selectedTab);
  }
  public close(i: number) {
    this.tabs[i].isActive = false;
    const tab = this.tabs[i + 1] || this.tabs[i - 1] || {};
    this.tabs.splice(i, 1);
    this.selectTab(tab.name);
  }
}
</script>
