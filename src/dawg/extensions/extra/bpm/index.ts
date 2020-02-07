import { createExtension } from '@/framework/extensions';
import { createComponent, ref, watch } from '@vue/composition-api';
import * as dawg from '@/dawg';
import { vueExtend } from '@/lib/vutils';

export const extension = createExtension({
  id: 'dawg.bpm',
  activate() {
    const component = vueExtend(createComponent({
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
