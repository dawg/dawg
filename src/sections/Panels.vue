<template>
  <base-tabs 
    class="tabs-panels secondary" 
    ref="panels"
    :selected-tab="specific.openedPanel"
    @update:selectedTab="specific.setOpenedPanel"
  >
    <panel name="Instruments">
      <synths 
        :instruments="project.instruments"
        :selected-score="specific.selectedScore"
        @update:selectedScore="specific.setScore"
        :selected-pattern="specific.selectedPattern"
        :scores="specific.selectedScore"
      ></synths>
    </panel>
    <panel name="Mixer">
      <mixer 
        :channels="project.channels"
        :play="general.play"
        @add="project.addEffect"
        @delete="project.deleteEffect"
        @set="project.setOption"
      ></mixer>
    </panel>
    <panel name="Piano Roll">
      <piano-roll-sequencer
        style="height: 100%"
        v-if="shouldRender"
        :elements="notes"
        :transport="transport"
        :instrument="instrument"
        :play="pianoRollPlay"
        :steps-per-beat="project.stepsPerBeat"
        :beats-per-measure="project.beatsPerMeasure"
        :row-height="specific.pianoRollRowHeight"
        @update:rowHeight="specific.setPianoRollRowHeight"
        :px-per-beat="specific.pianoRollBeatWidth"
        @update:pxPerBeat="specific.setPianoRollBeatWidth"
      ></piano-roll-sequencer>
    </panel>
    <!-- <panel name="Sample">
      <sample-viewer url="thing.wav"></sample-viewer>
    </panel> -->
  </base-tabs>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import { project, specific, general } from '@/store';
import BaseTabs from '@/components/BaseTabs.vue';
import Mixer from '@/components/Mixer.vue';
import SampleViewer from '@/components/SampleViewer.vue';
import Synths from '@/components/Synths.vue';
import Panel from '@/components/Panel.vue';
import { Note, EffectName, Channel, EffectOptions } from '@/schemas';

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
  public project = project;
  public general = general;
  public specific = specific;

  public $refs!: {
    panels: BaseTabs;
  };

  get notes() {
    if (specific.selectedScore) {
      return specific.selectedScore.notes;
    }
  }

  get shouldRender() {
    return !!specific.selectedScore;
  }

  get instrument() {
    if (specific.selectedScore) {
      return project.instrumentLookup[specific.selectedScore.instrumentId];
    }
  }

  get transport() {
    if (specific.selectedPattern) {
      return specific.selectedPattern.transport;
    }
  }

  get pianoRollPlay() {
    return general.play && specific.applicationContext === 'pianoroll';
  }

  public mounted() {
    general.setPanels(this.$refs.panels);
  }
}
</script>

<style lang="sass" scoped>

</style>