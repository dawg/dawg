import Vue from 'vue';
import { createExtension } from '..';
import * as dawg from '@/dawg';
import path from 'path';
import { computed } from '@vue/composition-api';

export const extension = createExtension({
  id: 'dawg.project-name',
  activate() {
    const openedFile = dawg.project.openedFile;
    const projectName = computed(() => {
      return openedFile.value === null ? '' : path.basename(openedFile.value).split('.')[0];
    });

    const component = Vue.extend({
      template: `
        <div v-tooltip="'Project Name'" class="text-default">
          {{ projectName.value }}
        </div>
      `,
      data: () => ({
        projectName,
      }),
    });

    dawg.ui.statusBar.push({
      component,
      position: 'left',
      order: 1,
    });
  },
});
