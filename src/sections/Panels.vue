<template>
  <base-tabs 
    class="tabs-panels secondary" 
    ref="panels"
    :selected-tab="specific.openedPanel"
    @update:selected-tab="specific.setOpenedPanel"
  >
    <panel name="Instruments">
      <synths 
        :instruments="project.instruments"
        :selected-score="specific.selectedScore"
        @update:selectedScore="specific.setScore"
        :selected-pattern="specific.selectedPattern"
        @update:selected-pattern="specific.setPattern"
        :scores="specific.selectedScore"
      ></synths>
    </panel>
    <panel name="Mixer">
      <mixer :channels="project.channels"></mixer>
    </panel>
    <panel name="Piano Roll">
      <piano-roll 
        v-if="shouldRender"
        v-model="notes"
        :part="part"
        :instrument="instrument"
        :play="general.play"
      ></piano-roll>
    </panel>
    <panel name="Sample">
      <div></div>
    </panel>
  </base-tabs>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import { project, specific, general } from '@/store';
import Mixer from '@/components/Mixer.vue';
import PianoRoll from '@/components/PianoRoll.vue';
import Synths from '@/components/Synths.vue';
import Panel from '@/components/Panel.vue';
import BaseTabs from '@/components/BaseTabs.vue';
import { Note } from '@/schemas';
import { Part } from 'tone';

@Component({
  components: {
    Mixer,
    PianoRoll,
    Synths,
    Panel,
    BaseTabs,
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

  get part() {
    if (specific.selectedPattern) {
      return specific.selectedPattern.part;
    }
  }

  public mounted() {
    general.setPanels(this.$refs.panels);
  }
}
</script>

<style lang="sass" scoped>

</style>