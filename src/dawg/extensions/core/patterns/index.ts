import Vue from 'vue';
import Patterns from '@/dawg/extensions/core/patterns/Patterns.vue';
import { value, computed, createComponent } from 'vue-function-api';
import { makeLookup } from '@/modules/utils';
import { general } from '@/store';
import { Pattern } from '@/core';
import { manager } from '@/dawg/extensions/manager';
import { ui } from '@/dawg/ui';

export const patterns = manager.activate({
  id: 'dawg.patterns',
  activate() {
    const selectedPatternId = value<null | string>(null);

    const patternLookup = computed(() => {
      // TODO
      return makeLookup(general.project.patterns);
    });

    const selectedPattern = computed(() => {
      if (selectedPatternId.value === null) { return null; }
      const p = patternLookup.value[selectedPatternId.value];
      if (!p) {
        return null;
      }

      return p;
    });

    const setPattern = (pattern: Pattern | null) => {
      if (pattern) {
        selectedPatternId.value = pattern.id;
      } else {
        selectedPatternId.value = null;
      }

      // TODO(jacob)
      // if (!this.selectedScoreId || !this.scoreLookup) {
      //   return;
      // }

      // if (this.selectedScoreId in this.scoreLookup) {
      //   return;
      // }

      // this.set({ key: 'selectedScoreId', value: null });
    };

    const wrapper = Vue.extend(createComponent({
      components: { Patterns },
      template: `
      <patterns
        :value="selectedPattern"
        :patterns="patterns"
        @input="setPattern"
        @remove="remove"
      ></patterns>
      `,
      setup: () => ({
        selectedPattern,
        setPattern,
        patterns: general.project.patterns,
        remove: (i: number) => general.project.removePattern(i),
      }),
    }));

    ui.activityBar.push({
      icon: 'queue_play',
      name: 'Patterns',
      component: wrapper,
    });

    return {
      selectedPattern,
    };
  },
});
