import { createExtension } from '@/lib/framework/extensions';
import { createComponent } from '@vue/composition-api';
import * as dawg from '@/dawg';
import Vue from 'vue';

export const extension = createExtension({
  id: 'dawg.bpm',
  activate() {
    const component = Vue.extend(createComponent({
      props: {},
      template: `<bpm v-model="bpm"></bpm>`,
      setup() {
        return {
          bpm: dawg.project.bpm,
        };
      },
    }));

    dawg.ui.toolbar.push({
      component,
      position: 'left',
      order: 2,
    });
  },
});
