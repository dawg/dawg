import Vue from 'vue';
import { createExtension } from '../..';
import * as dawg from '@/dawg';
import { createComponent, computed } from 'vue-function-api';

export const extension = createExtension({
  id: 'dawg.play',
  activate() {
    const stop = Vue.extend(createComponent({
      template: `
      <v-btn icon style="margin: 0">
        <dg-icon fa>stop</dg-icon>
      </v-btn>
      `,
    }));

    dawg.ui.toolbar.push({
      component: stop,
      position: 'right',
      order: 1,
    });

    const playPause = Vue.extend(createComponent({
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
            return dawg.project.state.value === 'started' ? 'play' : 'pause';
          }),
        };
      },
    }));

    dawg.ui.toolbar.push({
      component: playPause,
      position: 'right',
      order: 2,
    });
  },
});
