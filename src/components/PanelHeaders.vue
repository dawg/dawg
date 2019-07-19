<template>
  <ul class="tabs-headers">
    <li
      v-for="(tab, i) in tabs"
      :key="i" 
      :class="isActive(tab)"
      class="tabs-header"
    >
      <div @click="selectPanel(tab.name)" class="text foreground--text">{{ tab.name }}</div>
    </li>
    <div style="flex-grow: 1"></div>
    <tooltip-icon
      class="action"
      v-for="action in actions"
      :key="action.icon.value"
      :tooltip="action.tooltip.value"
      v-bind="action.props"
      bottom
      @click.native="action.callback"
    >
      {{ action.icon.value }}
    </tooltip-icon>
  </ul>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import * as base from '@/base';

@Component
export default class PanelHeaders extends Vue {
  get itemLookup() {
    const lookup: { [name: string]: base.PanelItem } = {};
    base.ui.panels.forEach((item) => {
      lookup[item.name] = item;
    });

    return lookup;
  }

  get actions() {
    if (base.ui.openedPanel.value === undefined) {
      return [];
    }

    const panel = this.itemLookup[base.ui.openedPanel.value];
    if (!panel) {
      return [];
    }

    return panel.actions || [];
  }

  get tabs() {
    return base.ui.panels;
  }

  public isActive(tab: base.PanelItem) {
    if (tab.name === base.ui.openedPanel.value) {
      return 'is-active';
    }
  }

  public selectPanel(name: string) {
    base.ui.openedPanel.value = name;
  }
}

</script>

<style lang="sass" scoped>
.tabs-headers
  align-items: stretch
  display: flex
  padding: 0

.tabs-header
    position: relative
    color: #999
    font-size: 14px
    font-weight: 600
    list-style: none
    text-align: center
    padding: .75em 1em

    &.is-active
      color: #000
      box-shadow: unset
      
      & .text
        border-bottom: 1px solid

.action
  padding: .75em 1em
  user-select: none

.text
  align-items: center
  text-decoration: none
  display: inline-block
  padding: 0 2px
  user-select: none

  &:hover
    cursor: default
</style>