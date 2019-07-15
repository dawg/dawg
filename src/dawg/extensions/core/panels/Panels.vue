<template>
  <base-tabs 
    class="tabs-panels secondary" 
    ref="panels"
    :selected-tab.sync="openedPanel.value"
    :first="dawg.ui.panels[0] ? dawg.ui.panels[0].name : undefined"
  >
    <panel 
      v-for="item in dawg.ui.panels"
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
import * as dawg from '@/dawg';

@Component({
  components: {
    BaseTabs,
    Panel,
  },
})
export default class Panels extends Vue {
  public dawg = dawg;

  get openedPanel() {
    return dawg.panels.openedPanel;
  }
}
</script>

<style lang="sass" scoped>

</style>