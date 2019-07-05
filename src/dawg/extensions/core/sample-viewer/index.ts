import Vue from 'vue';
import { createExtension } from '@/dawg/extensions';
import SampleViewer from '@/dawg/extensions/core/sample-viewer/SampleViewer.vue';
import { ui } from '@/dawg/ui';
import { general } from '@/store';

export const extension = createExtension({
  id: 'dawg.sample-viewer',
  activate() {
    const component = Vue.extend({
      components: { SampleViewer },
      template: `
      <sample-viewer
        :sample="general.openedSample"
      ></sample-viewer>
      `,
      data: () => ({
        general,
      }),
    });

    ui.panels.push({
      name: 'Sample',
      component,
    });
  },
});
