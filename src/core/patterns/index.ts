import Vue from 'vue';
import Patterns from '@/core/patterns/Patterns.vue';
import { ref, computed, createComponent, watch } from '@vue/composition-api';
import { makeLookup } from '@/lib/std';
import { Pattern } from '@/models';
import * as framework from '@/lib/framework';
import { project } from '@/core/project';
import * as t from '@/lib/io';

export const patterns = framework.manager.activate({
  id: 'dawg.patterns',
  workspace: {
    selectedPatternId: t.string,
  },
  activate(context) {
    const selectedPatternId = context.workspace.selectedPatternId;
    const pattern = ref<Pattern>();

    const patternLookup = computed(() => {
      return makeLookup(project.patterns);
    });

    if (selectedPatternId.value) {
      pattern.value = patternLookup.value[selectedPatternId.value];
    }

    const openPatternsTab = () => {
      framework.ui.openedSideTab.value = 'Patterns';
    };

    watch(pattern, () => {
      selectedPatternId.value = pattern.value ? pattern.value.id : undefined;

      if (pattern.value && framework.ui.openedSideTab.value !== 'Patterns') {
        openPatternsTab();
      }
    });

    const wrapper = Vue.extend(createComponent({
      props: {},
      components: { Patterns },
      template: `
      <patterns
        v-model="pattern"
        :patterns="patterns"
        :beats-per-measure="project.beatsPerMeasure"
        @remove="remove"
      ></patterns>
      `,
      setup: () => ({
        pattern,
        patterns: project.patterns,
        project,
        remove: (i: number) => project.removePattern(i),
      }),
    }));

    framework.ui.activityBar.push({
      icon: 'queue',
      name: 'Patterns',
      component: wrapper,
      actions: [{
        icon: ref('add'),
        tooltip: ref('Add Pattern'),
        callback: () => {
          project.addPattern();
        },
      }],
      order: 2,
    });

    return {
      selectedPattern: pattern,
      openPatternsTab,
    };
  },
});
