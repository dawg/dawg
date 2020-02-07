import Vue from 'vue';
import SampleViewer from '@/dawg/extensions/core/sample-viewer/SampleViewer.vue';
import { Action } from '@/dawg/extensions/core/sample-viewer/types';
import * as framework from '@/lib/framework';
import { ref, watch } from '@vue/composition-api';
import { Sample } from '@/core';

export const sampleViewer = framework.manager.activate({
  id: 'dawg.sample-viewer',
  activate() {
    const actions: Action[] = [];
    const openedSample = ref<Sample>();

    watch(openedSample, () => {
      if (openedSample.value) {
        framework.ui.openedPanel.value = 'Sample';
      }
    });

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

    framework.ui.panels.push({
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
