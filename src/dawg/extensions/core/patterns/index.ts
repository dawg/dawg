import Vue from 'vue';
import Patterns from '@/dawg/extensions/core/patterns/Patterns.vue';
import { ref, computed, createComponent, watch } from '@vue/composition-api';
import { makeLookup, vueExtend } from '@/utils';
import { Pattern } from '@/core';
import * as framework from '@/framework';
import { project } from '@/dawg/extensions/core/project';
import * as t from '@/modules/io';

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

    watch(pattern, () => {
      selectedPatternId.value = pattern.value ? pattern.value.id : undefined;

      if (pattern.value && framework.ui.openedSideTab.value !== 'Patterns') {
        framework.ui.openedSideTab.value = 'Patterns';
      }
    });

    const wrapper = vueExtend(createComponent({
      components: { Patterns },
      template: `
      <patterns
        v-model="pattern"
        :patterns="patterns"
        @remove="remove"
      ></patterns>
      `,
      setup: () => ({
        pattern,
        patterns: project.patterns,
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
    };
  },
});
