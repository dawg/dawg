<template>
  <base-tabs class="tabs-panels secondary" ref="panels">
    <panel name="Instruments">
      <synths 
        :instruments="project.instruments"
        :selected-score.sync="project.selectedScore"
        :selected-pattern="project.selectedPattern"
        :instrument.sync="project.selectedSynth"
        :scores="project.selectedScore"
      ></synths>
    </panel>
    <panel name="Mixer">
      <mixer></mixer>
    </panel>
    <panel name="Piano Roll">
      <piano-roll 
        v-model="notes"
        :part="part"
        :synth="project.selectedSynth"
        :play="play"
        @added="added"
        @removed="removed"
      ></piano-roll>
    </panel>
    <panel name="Sample">
      <div></div>
    </panel>
  </base-tabs>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import { project } from '@/store';
import Mixer from '@/components/Mixer.vue';
import PianoRoll from '@/components/PianoRoll.vue';
import Synths from '@/components/Synths.vue';
import Panel from '@/components/Panel.vue';

@Component({
  components: {
    Mixer,
    PianoRoll,
    Synths,
    Panel,
  },
})
export default class NAME extends Vue {
  @Prop(String) public PROP!: string;

  public project = project;

  get notes() {
    if (!project.selectedScore) { return []; }
    return project.selectedScore.notes;
  }
}
</script>

<style lang="sass" scoped>

</style>