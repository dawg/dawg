import Vue from 'vue';
import Patterns from '@/dawg/extensions/core/patterns/Patterns.vue';
import { value, computed, createComponent } from 'vue-function-api';
import { makeLookup } from '@/utils';
import { Pattern } from '@/core';
import { manager } from '@/base/manager';
import { ui } from '@/base/ui';
import { project } from '@/dawg/extensions/core/project';

export const patterns = manager.activate({
  id: 'dawg.patterns',
  activate() {
    const selectedPatternId = value<null | string>(null);

    const patternLookup = computed(() => {
      return makeLookup(project.project.patterns);
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
        patterns: project.project.patterns,
        remove: (i: number) => project.project.removePattern(i),
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
