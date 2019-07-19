<template>
  <base-tabs 
    class="tabs-panels secondary" 
    ref="panels"
    :selected-tab.sync="openedPanel.value"
    :first="base.ui.panels[0] ? base.ui.panels[0].name : undefined"
  >
    <panel 
      v-for="item in base.ui.panels"
      :key="item.name"
      :name="item.name"
      :selected-tab="openedPanel.value"
    >
      <component
        :is="item.component"
      ></component>
    </panel>

  </base-tabs>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import BaseTabs from '@/components/BaseTabs.vue';
import Panel from '@/components/Panel.vue';
import { Note, EffectName, Channel, EffectOptions } from '@/core';
import * as base from '@/base';

@Component({
  components: {
    BaseTabs,
    Panel,
  },
})
export default class Panels extends Vue {
  public base = base;

  get openedPanel() {
    return base.ui.openedPanel;
  }
}
</script>

<style lang="sass" scoped>

</style>