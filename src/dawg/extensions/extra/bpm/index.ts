import { createExtension } from '@/dawg/extensions';
import { createComponent, computed, value, watch } from 'vue-function-api';
import Vue from 'vue';
import * as dawg from '@/dawg';

export const extension = createExtension({
  id: 'dawg.bpm',
  activate() {
    const component = Vue.extend(createComponent({
      template: `<bpm v-model="bpm"></bpm>`,
      setup() {
        const bpm = value(dawg.project.project.bpm);
        watch(bpm, () => {
          dawg.project.project.setBpm(bpm.value);
        });

        return {
          bpm,
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
