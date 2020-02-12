<template>
  <div class="synths">
    <synth
      v-for="(instrument, i) in instruments"
      :key="i"
      @delete="deleteInstrument(i)"
      @open="openScore(i)"
      :instrument="instrument"
      :notes="getNotes(instrument)"
      :channel="instrument.channel"
      @update:channel="project.setChannel({ instrument, channel: $event })"
    ></synth>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Synth from '@/components/Synth.vue';
import { Nullable } from '@/lib/vutils';
import { Score, Instrument, Pattern } from '@/models';
import { Watch } from '@/lib/update';
import { notify } from '@/core/notify';
import * as framework from '@/lib/framework';
import { project } from '@/core/project';

@Component({ components: { Synth } })
export default class Synths extends Vue {
  @Prop({ type: Array, required: true }) public instruments!: Array<Instrument<any, any>>;
  @Prop(Nullable(Object)) public selectedScore!: Score | null;
  @Prop(Object) public selectedPattern!: Pattern | undefined;

  get project() {
    return project;
  }

  get scoreLookup() {
    const lookup: {[k: string]: Score} = {};
    if (this.selectedPattern) {
      this.selectedPattern.scores.forEach((score) => {
        lookup[score.instrumentId] = score;
      });
    }
    return lookup;
  }

  public getNotes(instrument: Instrument<any, any>) {
    if (instrument.id in this.scoreLookup) {
      return this.scoreLookup[instrument.id].notes.slice();
    }
  }

  public async openScore(i: number) {
    if (!this.selectedPattern) {
      notify.warning('Please select a Pattern first.', {
        detail: 'You must select a pattern before you can open the Piano Roll',
      });
      return;
    }

    const instrument = this.instruments[i];
    if (!this.scoreLookup.hasOwnProperty(instrument.id)) {
      project.addScore({ pattern: this.selectedPattern, instrument });
    }

    this.$update('selectedScore', this.scoreLookup[instrument.id]);
  }

  public deleteInstrument(i: number) {
    project.deleteInstrument(i);
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