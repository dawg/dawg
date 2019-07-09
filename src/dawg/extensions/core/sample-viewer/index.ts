import Vue from 'vue';
import SampleViewer from '@/dawg/extensions/core/sample-viewer/SampleViewer.vue';
import { Action } from '@/dawg/extensions/core/sample-viewer/types';
import { ui } from '@/dawg/ui';
import { general } from '@/store';
import { manager } from '../../manager';

export const sampleViewer = manager.activate({
  id: 'dawg.sample-viewer',
  activate() {
    const actions: Action[] = [];

    const component = Vue.extend({
      components: { SampleViewer },
      template: `
      <sample-viewer
        :sample="general.openedSample"
        :actions="actions"
      ></sample-viewer>
      `,
      data: () => ({
        general,
        actions,
      }),
    });

    ui.panels.push({
      name: 'Sample',
      component,
    });

    return {
      addAction(action: Action) {
        actions.push(action);
        return {
          dispose() {
            const i = actions.indexOf(action);
            if (i < 0) {
              return;
            }

            actions.splice(i, 1);
          },
        };
      },
    };
  },
});
