<template>
  <div class="synths">
    <synth
      v-for="(instrument, i) in instruments"
      :key="instrument.name"
      @contextmenu="contextmenu($event, i)"
      :instrument="instrument"
      :notes="getNotes(instrument)"
    ></synth>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Tone from 'tone';
import Synth from '@/components/Synth.vue';
import { Nullable } from '@/utils';
import { Score, Instrument, Pattern } from '@/schemas';
import { Watch } from '@/modules/update';

// TODO We should probably create events so that we don't need to import the store here.
// I'm leaving this for now though.
import { project, specific } from '@/store';

@Component({ components: { Synth } })
export default class Synths extends Vue {
  @Prop({ type: Array, required: true }) public instruments!: Instrument[];
  @Prop(Nullable(Object)) public selectedScore!: Score | null;
  @Prop(Nullable(Object)) public selectedPattern!: Pattern | null;

  get scoreLookup() {
    const lookup: {[k: string]: Score} = {};
    if (this.selectedPattern) {
      this.selectedPattern.scores.forEach((score) => {
        lookup[score.instrumentId] = score;
      });
    }
    return lookup;
  }

  public getNotes(instrument: Instrument) {
    if (instrument.id in this.scoreLookup) {
      return this.scoreLookup[instrument.id].notes;
    }
  }

  public async openScore(i: number) {
    if (!this.selectedPattern) {
      this.$notify.warning('Please create a Pattern first.');
      return;
    }

    const instrument = this.instruments[i];
    if (!this.scoreLookup.hasOwnProperty(instrument.id)) {
      project.addScore({ pattern: this.selectedPattern, instrument });
    }

    this.$update('selectedScore', this.scoreLookup[instrument.id]);
    specific.setOpenedPanel('Piano Roll'); // TODO AHH Hardcoding
  }

  public contextmenu(e: MouseEvent, i: number) {
    this.$context(e, [
      {
        callback: () => project.deleteInstrument(i),
        text: 'Delete',
      },
      {
        callback: () => this.openScore(i),
        text: 'Open In Piano Roll',
      },
    ]);
  }

  @Watch<Synths>('selectedPattern', { immediate: true })
  public selectScore() {
    if (this.selectedPattern) {
      this.$update('selectedScore', this.selectedPattern.scores[0] || null);
    } else {
      this.$update('selectedScore', null);
    }
  }
}
</script>

<style lang="sass" scoped>

</style>