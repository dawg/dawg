<template>
  <base-tabs 
    class="tabs-panels secondary" 
    ref="panels"
    :selected-tab.sync="openedPanel.value"
  >
    <panel 
      v-for="item in dawg.ui.panels"
      :key="item.name"
      :name="item.name"
    >
      <component
        :is="item.component"
      ></component>
    </panel>

  </base-tabs>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import { workspace, general } from '@/store';
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
  public general = general;
  public workspace = workspace;

  public $refs!: {
    panels: BaseTabs;
  };

  get openedPanel() {
    return dawg.panels.openedPanel;
  }

  get selectedPattern() {
    return dawg.patterns.selectedPattern.value;
  }

  get selectedScore() {
    return dawg.instruments.selectedScore;
  }

  get pianoRollPlay() {
    return general.play && workspace.applicationContext === 'pianoroll';
  }

  public mounted() {
    general.setPanels(this.$refs.panels);
  }
}
</script>

<style lang="sass" scoped>

</style>