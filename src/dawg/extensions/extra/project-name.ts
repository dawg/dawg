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
      <v-tooltip top>
        <div slot="activator" class="name item">{{ projectName.value }}</div>
        <div>Project Name</div>
      </v-tooltip>
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
