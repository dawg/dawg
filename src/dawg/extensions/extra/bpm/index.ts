import { createExtension } from '@/dawg/extensions';
import { createComponent, ref, watch } from '@vue/composition-api';
import * as dawg from '@/dawg';
import { vueExtend } from '@/utils';

export const extension = createExtension({
  id: 'dawg.bpm',
  activate() {
    const component = vueExtend(createComponent({
      template: `<bpm v-model="bpm"></bpm>`,
      setup() {
        const bpm = ref(dawg.project.project.bpm);
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
