<template>
  <div class="synths">
    <synth
      v-for="(instrument, i) in instruments"
      :key="instrument.name"
      @contextmenu.native="contextmenu($event, i)"
      :instrument="instrument"
      :notes="getNotes(instrument)"
      :channel="instrument.channel"
      @update:channel="general.project.setChannel({ instrument, channel: $event })"
    ></synth>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Tone from 'tone';
import Synth from '@/components/Synth.vue';
import { Nullable } from '@/utils';
import { Score, Instrument, Pattern } from '@/core';
import { Watch } from '@/modules/update';
import { workspace, general } from '@/store';

@Component({ components: { Synth } })
export default class Synths extends Vue {
  // TODO remove these, this component can just import the store
  @Prop({ type: Array, required: true }) public instruments!: Array<Instrument<any>>;
  @Prop(Nullable(Object)) public selectedScore!: Score | null;
  @Prop(Nullable(Object)) public selectedPattern!: Pattern | null;

  public general = general;

  get scoreLookup() {
    const lookup: {[k: string]: Score} = {};
    if (this.selectedPattern) {
      this.selectedPattern.scores.forEach((score) => {
        lookup[score.instrumentId] = score;
      });
    }
    return lookup;
  }

  public getNotes(instrument: Instrument<any>) {
    if (instrument.id in this.scoreLookup) {
      return this.scoreLookup[instrument.id].notes;
    }
  }

  public async openScore(i: number) {
    if (!this.selectedPattern) {
      this.$notify.warning('Please select a Pattern first.', {
        detail: 'You must select a pattern before you can open the Piano Roll',
      });
      return;
    }

    const instrument = this.instruments[i];
    if (!this.scoreLookup.hasOwnProperty(instrument.id)) {
      general.project.addScore({ pattern: this.selectedPattern, instrument });
    }

    this.$update('selectedScore', this.scoreLookup[instrument.id]);
    workspace.setOpenedPanel('Piano Roll');
  }

  public contextmenu(event: MouseEvent, i: number) {
    this.$context({
      event,
      items: [
        {
          callback: () => general.project.deleteInstrument(i),
          text: 'Delete',
        },
        {
          callback: () => this.openScore(i),
          text: 'Open In Piano Roll',
        },
      ],
    });
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