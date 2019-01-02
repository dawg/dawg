<template>
  <div class="synths">
    <synth
      v-for="(synth, i) in project.instruments"
      :key="synth.name"
      @click="selectSynth(i)"
      :name="synth.name"
    ></synth>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Tone from 'tone';
import Synth from '@/components/Synth.vue';
import { Nullable } from '@/utils';
import { Score } from '@/models';

@Component
export default class Synths extends Vue {
  @Prop({ type: Array, required: true }) public synths!: Synth[];
  @Prop({ type: Array, required: true }) public scores!: Score[];
  @Prop(Nullable(Tone.PolySynth)) public synth!: Tone.PolySynth | null;
  @Prop(Nullable(Object)) public score!: Score | null;

  public selectSynth(i: number) {
    this.synths.slice(0, i).forEach((synth) => synth.selected = false);
    this.synths.slice(i + 1).forEach((synth) => synth.selected = false);
    this.synths[i].selected = !this.synths[i].selected;

    if (this.synths[i].selected) {
      this.$update('synth', this.synths[i].synth);
    } else {
      this.$update('synth', null);
    }
  }
}
</script>

<style lang="sass" scoped>

</style>