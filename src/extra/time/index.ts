import { createExtension } from '@/lib/framework/extensions';
import TimeDisplay from '@/extra/time/TimeDisplay.vue';
import * as dawg from '@/dawg';
import { createComponent, ref, watch } from '@vue/composition-api';
import Vue from 'vue';

export const extension = createExtension({
  id: 'dawg.time',
  activate() {
    const component = Vue.extend(createComponent({
      props: {},
      components: { TimeDisplay },
      template: `
      <time-display
        style="margin-right: 10px"
        :raw="seconds"
      ></time-display>
      `,
      setup() {
        const seconds = ref(0);

        const update = () => {
          if (dawg.controls.state.value === 'started') {
            requestAnimationFrame(update);
          }
          seconds.value = dawg.controls.getTime();
        };

        watch(dawg.controls.state, () => {
          if (dawg.controls.state.value === 'started') {
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
