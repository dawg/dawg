import { manager } from '@/dawg/extensions/manager';
import { value, Wrapper, computed } from 'vue-function-api';
import { patterns } from '@/dawg/extensions/core/patterns';
import { Score } from '@/core';

export const instruments = manager.activate({
  id: 'dawg.instruments',
  activate() {
    const selectedScoreId: Wrapper<string | null> = value(null);

    const scoreLookup = computed(() => {
      if (!patterns.selectedPattern.value) { return null; }
      const scores: {[k: string]: Score} = {};

      // TODO MAKE LOOKUP
      patterns.selectedPattern.value.scores.forEach((score) => {
        scores[score.id] = score;
      });
      return scores;
    });

    const selectedScore = computed(
      () => {
        if (!selectedScoreId.value) { return null; }
        if (!scoreLookup.value) { return null; }
        if (!scoreLookup.hasOwnProperty(selectedScoreId.value)) { return null; }
        return scoreLookup.value[selectedScoreId.value];
      },
      (pattern) => {
        if (pattern) {
          selectedScoreId.value = pattern.id;
        } else {
          selectedScoreId.value = null;
        }
      },
    );

    return {
      selectedScore,
    };
  },
});
