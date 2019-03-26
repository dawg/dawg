<template>
  <base-tabs 
    class="tabs-panels secondary" 
    ref="panels"
    :selected-tab="workspace.openedPanel"
    @update:selectedTab="workspace.setOpenedPanel"
  >
    <panel name="Instruments">
      <synths 
        :instruments="general.project.instruments"
        :selected-score="workspace.selectedScore"
        @update:selectedScore="workspace.setScore"
        :selected-pattern="workspace.selectedPattern"
        :scores="workspace.selectedScore"
      ></synths>
    </panel>
    <panel name="Mixer">
      <mixer 
        :channels="general.project.channels"
        :play="general.play"
        @add="(payload) => general.project.addEffect(payload)"
        @delete="(payload) => general.project.deleteEffect(payload)"
      ></mixer>
    </panel>
    <panel name="Piano Roll">
      <piano-roll-sequencer
        style="height: 100%"
        v-if="workspace.selectedScore"
        :pattern="workspace.selectedPattern"
        :score="workspace.selectedScore"
        :play="pianoRollPlay"
        :steps-per-beat="general.project.stepsPerBeat"
        :beats-per-measure="general.project.beatsPerMeasure"
        :row-height="workspace.pianoRollRowHeight"
        :px-per-beat="workspace.pianoRollBeatWidth"
        @update:rowHeight="workspace.setPianoRollRowHeight"
        @update:pxPerBeat="workspace.setPianoRollBeatWidth"
      ></piano-roll-sequencer>
    </panel>
    <panel name="Sample">
      <sample-viewer url="thing.wav"></sample-viewer>
    </panel>
  </base-tabs>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import { workspace, general } from '@/store';
import BaseTabs from '@/components/BaseTabs.vue';
import Mixer from '@/components/Mixer.vue';
import SampleViewer from '@/components/SampleViewer.vue';
import Synths from '@/components/Synths.vue';
import Panel from '@/components/Panel.vue';
import { Note, EffectName, Channel, EffectOptions } from '@/core';

@Component({
  components: {
    BaseTabs,
    Mixer,
    Panel,
    SampleViewer,
    Synths,
  },
})
export default class Panels extends Vue {
  public general = general;
  public workspace = workspace;

  public $refs!: {
    panels: BaseTabs;
  };

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