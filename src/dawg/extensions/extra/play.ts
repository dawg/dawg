import { createExtension } from '@/dawg/extensions';
import * as dawg from '@/dawg';
import { createComponent, computed } from '@vue/composition-api';
import { vueExtend } from '@/utils';

export const extension = createExtension({
  id: 'dawg.play',
  activate() {
    const stop = vueExtend(createComponent({
      template: `
      <v-btn icon style="margin: 0">
        <dg-icon fa>stop</dg-icon>
      </v-btn>
      `,
    }));

    dawg.ui.toolbar.push({
      component: stop,
      position: 'right',
      order: 2,
    });

    const playPause = vueExtend(createComponent({
      template: `
      <v-btn icon style="margin: 0" @click="toggle">
        <icon :name="icon" class="foreground--text"></icon>
      </v-btn>
      `,
      setup() {
        return {
          toggle: () => {
            dawg.project.playPause();
          },
          icon: computed(() => {
            return dawg.project.state.value === 'started' ? 'pause' : 'play';
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
