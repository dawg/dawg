<template>
  <div class="patterns">
    <pattern-list-element
      v-for="(pattern, i) in patterns"
      :key="pattern.id"
      :pattern="pattern"
      :selected="pattern === value"
      :beats-per-measure="beatsPerMeasure"
      @click.native="click(pattern)"
      @remove="remove(i)"
    ></pattern-list-element>
  </div>
</template>

<script lang="ts">
import { Pattern, ScheduledPattern, createPatternPrototype } from '@/models';
import { Nullable } from '@/lib/vutils';
import * as framework from '@/lib/framework';
import { theme } from '@/core/theme';
import { createComponent, ref, computed, watch } from '@vue/composition-api';
import PatternListElement from '@/core/patterns/PatternListElement.vue';

export default createComponent({
  components: { PatternListElement },
  props: {
    value: Object as () => Pattern | undefined,
    patterns: { type: Array as () => Pattern[], required: true },
    beatsPerMeasure: { type: Number, required: true },
  },
  setup(props, context) {
    const contenteditable = ref(false);

    function click(p: Pattern) {
      if (props.value && props.value.id === p.id) {
        context.emit('input', null);
      } else {
        context.emit('input', p);
      }
    }

    watch(() => props.patterns, () => {
      if (props.value) { return; }
      if (props.patterns.length === 0) { return; }
      context.emit('input', props.patterns[0]);
    });

    return {
      contenteditable,
      click,
      remove: (i: number) => {
        context.emit('remove', i);
      },
    };
  },
});
</script>
