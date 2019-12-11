import Vue from 'vue';
import Patterns from '@/dawg/extensions/core/patterns/Patterns.vue';
import { ref, computed, createComponent } from '@vue/composition-api';
import { makeLookup, vueExtend } from '@/utils';
import { Pattern } from '@/core';
import { manager } from '@/base/manager';
import { ui } from '@/base/ui';
import { project } from '@/dawg/extensions/core/project';

export const patterns = manager.activate({
  id: 'dawg.patterns',
  activate() {
    const selectedPatternId = ref<null | string>(null);

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

    Vue.extend({
      props: [],
    });

    Vue.extend({
      props: {},
    });

    const wrapper = vueExtend(createComponent({
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
      icon: 'queue',
      name: 'Patterns',
      component: wrapper,
      actions: [{
        icon: ref('add'),
        tooltip: ref('Add Pattern'),
        callback: () => {
          project.project.addPattern();
        },
      }],
    });

    return {
      selectedPattern,
    };
  },
});
