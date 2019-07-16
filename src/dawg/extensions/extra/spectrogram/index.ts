import Vue from 'vue';
import { createExtension } from '@/dawg/extensions';
import * as dawg from '@/dawg';

export const extension = createExtension({
  id: 'dawg.spectrogram',
  activate() {
    const component = Vue.extend({
      template: `
      <spectrogram
        class="item"
        :color="theme.foreground"
      ></spectrogram>
      `,
      data: () => ({
        theme: dawg.theme,
      }),
    });

    dawg.ui.statusBar.push({
      component,
      position: 'left',
      order: 2,
    });
  },
});
