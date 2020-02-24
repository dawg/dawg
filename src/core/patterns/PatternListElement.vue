<template>
  <drag
    group="arranger"
    :class="classes"
    class="text-default hover:bg-default-lighten-2 cursor-pointer border py-3 px-4"
    :transfer-data="prototype"
    @contextmenu.native="contextmenu($event)"
  >
    <editable
      v-model="pattern.name"
      :contenteditable.sync="contenteditable"
      disableDblClick
      class="label"
    ></editable>
  </drag>
</template>

<script lang="ts">
import { createComponent, ref, computed, watch } from '@vue/composition-api';
import { Pattern, ScheduledPattern, createPatternPrototype } from '@/models';
import * as framework from '@/lib/framework';

export default createComponent({
  name: 'PatternListElement',
  props: {
    pattern: { type: Object as () => Pattern, required: true },
    selected: { type: Boolean, required: true },
    beatsPerMeasure: { type: Number, required: true },
  },
  setup(props, context) {
    const contenteditable = ref(false);

    function contextmenu(event: MouseEvent) {
      framework.context({
        position: event,
        items: [
          {
            text: 'Delete',
            callback: () => context.emit('remove'),
          },
          {
            text: 'Rename',
            callback: () => contenteditable.value = true,
          },
        ],
      });
    }

    const classes = computed(() => {
      if (props.selected) {
        return 'border-default-lighten-5';
      } else {
        return 'border-default';
      }
    });

    const prototype = computed(() => {
      let duration = props.pattern.scores.reduce((max, score) => {
        return Math.max(max, ...score.notes.map((note) => note.time.value + note.duration.value));
      }, 0.001);
      duration = Math.ceil(duration / props.beatsPerMeasure) * props.beatsPerMeasure;

      return createPatternPrototype({ row: 0, duration, time: 0 }, props.pattern);
    });

    return {
      contenteditable,
      classes,
      prototype,
      contextmenu,
    };
  },
});
</script>

<style lang="sass" scoped>

</style>