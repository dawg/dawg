import { createExtension } from '../..';
import { createComponent, computed } from 'vue-function-api';
import Vue from 'vue';
import * as dawg from '@/dawg';

export const extension = createExtension({
  id: 'dawg.bpm',
  activate() {
    const component = Vue.extend(createComponent({
      template: `<bpm v-model="bpm"></bpm>`,
      setup() {
        const bpm = computed(() => {
          return dawg.project.project.bpm;
        }, (v: number) => {
          dawg.project.project.setBpm(v);
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
