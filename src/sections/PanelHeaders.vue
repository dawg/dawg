<template>
  <ul class="tabs-headers">
    <li
      v-for="(tab, i) in tabs"
      :key="i" 
      :class="{ 'is-active': tab.isActive }"
      class="tabs-header"
    >
      <div @click="selectPanel(tab.name, $event)" class="text white--text">{{ tab.name }}</div>
    </li>
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
  </ul>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import BaseTabs from '@/components/BaseTabs.vue';
import { Nullable } from '@/utils';
import { project, cache, general, specific } from '@/store';
import { Watch } from '@/modules/update';

type ACTIONS = 'add';
interface Group {
  icon: string;
  tooltip: string;
  callback: () => void;
}

@Component
export default class PanelHeaders extends Vue {
  public synthActions: Group[] = [
    {
      icon: 'add',
      tooltip: 'Add Instrument',
      callback: project.addInstrument,
    },
  ];

  get actions() {
    // TODO NO Type Checking
    if (specific.openedPanel === 'Instruments') {
      return this.synthActions;
    } else {
      return [];
    }
  }

  get tabs() {
    if (general.panels) {
      return general.panels.tabs;
    } else {
      return [];
    }
  }

  public selectPanel(name: string, e: MouseEvent) {
    // TODO(jacob)
    specific.setOpenedPanel(name);
    if (general.panels) {
      general.panels.selectTab(name, e);
    }
  }

  // TODO(jacob) Finish this
  // @Watch<PanelHeaders>('panels')
  // public selectPanelIfNull() {
  //   if (!general.panels || cache.openedPanel) { return; }
  //   cache.setOpenedPanel(general.panels.tabs[0].name);
  // }
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

.text
  align-items: center
  text-decoration: none
  display: inline-block
  padding: 0 2px
  user-select: none

  &:hover
    cursor: default
</style>