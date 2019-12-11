import { createExtension } from '@/dawg/extensions';
import * as dawg from '@/dawg';
import { createComponent, computed } from '@vue/composition-api';
import { vueExtend } from '@/utils';

export const extension = createExtension({
  id: 'dawg.play',
  activate() {
    const stop = vueExtend(createComponent({
      template: `
      <dg-mat-icon class="text-default cursor-pointer" icon="stop"></dg-mat-icon>
      `,
    }));

    dawg.ui.toolbar.push({
      component: stop,
      position: 'right',
      order: 2,
    });

    const playPause = vueExtend(createComponent({
      template: `
      <dg-mat-icon class="text-default cursor-pointer" :icon="icon" @click="toggle"></dg-mat-icon>
      `,
      setup() {
        return {
          toggle: () => {
            dawg.project.playPause();
          },
          icon: computed(() => {
            return dawg.project.state.value === 'started' ? 'pause' : 'play_arrow';
          }),
        };
      },
    }));

    dawg.ui.toolbar.push({
      component: playPause,
      position: 'right',
      order: 3,
    });
  },
});
