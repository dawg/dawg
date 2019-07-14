import Vue from 'vue';
import { createExtension } from '../..';
import * as dawg from '@/dawg';
import { createComponent, value, watch } from 'vue-function-api';

export const extension = createExtension({
  id: 'dawg.time',
  activate() {
    const component = Vue.extend(createComponent({
      template: `
      <time-display
        style="margin-right: 10px"
        :raw="seconds"
      ></time-display>
      `,
      setup() {
        const seconds = value(0);

        const update = () => {
          if (dawg.project.state.value === 'started') {
            requestAnimationFrame(update);
          }
          seconds.value = dawg.project.getTime();
        };

        watch(dawg.project.state, () => {
          if (dawg.project.state.value === 'started') {
            update();
          }
        });

        return {
          seconds,
        };
      },
    }));

    dawg.ui.toolbar.push({
      component,
      position: 'left',
      order: 1,
    });
  },
});
