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
import MiniScore from '@/components/MiniScore.vue';
import { ScheduledNote, ScheduledPattern } from '@/models';
import { createComponent, computed, ref } from '@vue/composition-api';

export default createComponent({
  components: { MiniScore },
  name: 'PatternElement',
  props: {
    pxPerBeat: { type: Number, required: true },
    element: { type: Object as () => ScheduledPattern, required: true },
  },
  setup(props) {
    const totalDuration = ref(0);

    const notes = computed(() => {
      const allNotes: ScheduledNote[] = [];
      return allNotes.concat(...props.element.element.scores.map((score) => score.notes.l.slice()));
    });

    const scoreStyle = computed(() => {
      return {
        width: `${totalDuration.value * props.pxPerBeat}px`,
      };
    });

    return {
      totalDuration,
      notes,
      scoreStyle,
    };
  },
});
</script>

<style lang="sass" scoped>
.pattern-element
  overflow: hidden
  position: relative
</style>