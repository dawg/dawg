<template>
  <div class="synths">
    <synth
      v-for="(instrument, i) in instruments"
      :key="instrument.name"
      @click="selectSynth(i)"
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

@Component({ components: { Synth } })
export default class Synths extends Vue {
  @Prop({ type: Array, required: true }) public instruments!: Instrument[];
  @Prop(Nullable(Object)) public selectedScore!: Score | null;
  @Prop(Nullable(Object)) public selectedPattern!: Pattern | null;
  @Prop(Nullable(Object)) public instrument!: Instrument | null;

  public $children!: Synth[];

  get scoreLookup() {
    // TODO This assumes a unique name. We might need some sort of ID.
    const lookup: {[k: string]: Score} = {};
    if (this.selectedPattern) {
      this.selectedPattern.scores.forEach((score) => {
        lookup[score.instrument] = score;
      });
    }
    return lookup;
  }

  public selectSynth(i: number) {
    this.$children.slice(0, i).forEach((instrument) => instrument.selected = false);
    this.$children.slice(i + 1).forEach((instrument) => instrument.selected = false);
    this.$children[i].selected = !this.$children[i].selected;

    if (this.$children[i].selected) {
      this.$update('instrument', this.$children[i].instrument);
    } else {
      this.$update('instrument', null);
    }
  }

  public getNotes(instrument: Instrument) {
    if (instrument.name in this.scoreLookup) {
      return this.scoreLookup[instrument.name].notes;
    }
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