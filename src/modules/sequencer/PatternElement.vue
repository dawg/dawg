<template>
  <mini-score
    class="pattern-element"
    ref="score"
    :style="scoreStyle"
    :notes="notes"
  ></mini-score>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins, Inject } from 'vue-property-decorator';
import MiniScore from '@/modules/dawg/MiniScore.vue';
import { Note, ScheduledPattern } from '@/core';

@Component({
  components: { MiniScore },
})
export default class PatternElement extends Vue {
  @Prop({ type: Number, required: true }) public pxPerBeat!: number;
  @Prop({ type: Object, required: true }) public element!: ScheduledPattern;

  public score: MiniScore | null = null;

  get notes() {
    const notes: Note[] = [];
    return notes.concat(...this.element.pattern.scores.map((score) => score.notes));
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