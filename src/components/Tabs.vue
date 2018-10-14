<template>
  <div>
    <ul class="tabs-component-tabs">
      <li v-for="(tab, i) in tabs"
          :key="i" :class="{ 'is-active': tab.isActive }"
          class="tabs-component-tab">
        <span @click="selectTab(tab.name, $event)" class="text">{{ tab.name }}</span>
        <v-icon size="13px" class="close-icon" @click="close(i)">close</v-icon>
      </li>
    </ul>
    <div class="tabs-component-panels">
      <slot/>
    </div>
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
    if (event !== undefined) {
      event.preventDefault();
    }

    if (name === undefined) {
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

<style lang="sass" scoped>
  $border: #ddd

  .tabs-component-tabs
    border: 0
    padding: 0
    align-items: stretch
    display: flex
    justify-content: flex-start
    box-shadow: inset 0 -1px 0 $border

  .tabs-component-tab
    position: relative
    color: #999
    font-size: 14px
    font-weight: 600
    list-style: none
    background-color: #fff
    width: 150px
    text-align: center
    border-left: 1px solid $border
    box-shadow: inset 0 -1px 0 $border

    &.is-active
      color: #000
      box-shadow: unset

      &:last-of-type
        box-shadow: 1px 0 0 $border

      &:before
        content: ""
        position: absolute
        pointer-events: none
        z-index: 2
        top: 0
        left: -1px
        bottom: 0
        width: 3px
        background: #568af2

    &:hover .close-icon
      transform: scale(1)
      transition-duration: .16s


  .text
    align-items: center
    padding: .75em 1em
    text-decoration: none
    display: block

    &:hover
      cursor: default

  .tabs-component-panels
    background-color: #fff
    box-shadow: 0 0 10px rgba(0, 0, 0, .05)
    padding: 4em 2em

  .close-icon
    top: 0.75em
    right: 0.5em
    z-index: 2
    width: 1.5em
    height: 1.5em
    line-height: 1.5
    text-align: center
    border-radius: 3px
    overflow: hidden
    transform: scale(0)
    transition: transform .08s
    position: absolute

    &:hover
      cursor: pointer
      color: #001133
      background-color: #568af2
      transform: scale(1)
      transition-duration: .16s
</style>
