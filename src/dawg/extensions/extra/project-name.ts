import Vue from 'vue';
import { createExtension } from '..';
import * as dawg from '@/dawg';
import path from 'path';

export const extension = createExtension({
  id: 'dawg.project-name',
  activate() {
    const openedFile = dawg.project.getOpenedFile();
    const projectName = openedFile === null ? '' : path.basename(openedFile).split('.')[0];

    const component = Vue.extend({
      template: `
      <v-tooltip top>
        <div slot="activator" class="name item">{{ projectName }}</div>
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
