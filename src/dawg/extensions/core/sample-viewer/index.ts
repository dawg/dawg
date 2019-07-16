import Vue from 'vue';
import SampleViewer from '@/dawg/extensions/core/sample-viewer/SampleViewer.vue';
import { Action } from '@/dawg/extensions/core/sample-viewer/types';
import { ui } from '@/dawg/ui';
import { manager } from '@/dawg/extensions/manager';
import { value } from 'vue-function-api';
import { Sample } from '@/core';

export const sampleViewer = manager.activate({
  id: 'dawg.sample-viewer',
  activate() {
    const actions: Action[] = [];
    const openedSample = value<Sample | null>(null);

    const component = Vue.extend({
      components: { SampleViewer },
      template: `
      <sample-viewer
        :sample="openedSample.value"
        :actions="actions"
      ></sample-viewer>
      `,
      data: () => ({
        actions,
        openedSample,
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
      openedSample,
    };
  },
});
