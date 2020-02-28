<template>
  <mini-score
    class="pattern-element"
    :style="scoreStyle"
    :notes="notes"
    :offset="element.offset.value"
    :total-duration.sync="totalDuration"
  ></mini-score>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins, Inject } from 'vue-property-decorator';
import MiniScore from '@/components/MiniScore.vue';
import { ScheduledNote, ScheduledPattern } from '@/models';

@Component({
  components: { MiniScore },
})
export default class PatternElement extends Vue {
  @Prop({ type: Number, required: true }) public pxPerBeat!: number;
  @Prop({ type: Object, required: true }) public element!: ScheduledPattern;

  public totalDuration = 0;

  get notes() {
    const notes: ScheduledNote[] = [];
    return notes.concat(...this.element.element.scores.map((score) => score.notes.l.slice()));
  }

  get scoreStyle() {
    return {
      width: `${this.totalDuration * this.pxPerBeat}px`,
    };
  }
}
</script>

<style lang="sass" scoped>
.pattern-element
  overflow: hidden
  position: relative
</style>