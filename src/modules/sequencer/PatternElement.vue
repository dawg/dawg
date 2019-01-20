<template>
  <div class="pattern-element" :style="style">
    <mini-score 
      ref="score"
      :style="scoreStyle"
      :notes="notes"
    ></mini-score>
    <resizable
      :duration="duration"
      @update:duration="updateDuration"
    ></resizable>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins } from 'vue-property-decorator';
import MiniScore from '@/modules/dawg/MiniScore.vue';
import Resizable from '@/modules/sequencer/Resizable.vue';
import { Note, PlacedPattern } from '@/schemas';
import { Positionable } from '@/modules/sequencer/sequencer';

@Component({
  components: { MiniScore, Resizable },
})
export default class PatternElement extends Mixins(Positionable) {
  @Prop({ type: Object, required: true }) public element!: PlacedPattern;

  public score: MiniScore | null = null;

  get notes() {
    return [].concat.apply([], this.element.pattern.scores.map((score) => score.notes));
  }

  get scoreStyle() {
    if (!this.score) {
      return;
    }

    return {
      width: `${this.score.totalDuration * this.pxPerBeat}px`,
    };
  }

  public mounted() {
    this.score = this.$refs.score as MiniScore;
  }
}
</script>

<style lang="sass" scoped>
.pattern-element
  overflow: hidden
  position: relative
</style>