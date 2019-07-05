import Vue from 'vue';
import Mixer from '@/dawg/extensions/core/mixer/Mixer.vue';
import { general } from '@/store';
import { ui } from '@/dawg/ui';
import { createExtension } from '@/dawg/extensions';

export const extension = createExtension({
  id: 'dawg.mixer',
  activate() {
    const component = Vue.extend({
      components: { Mixer },
      template: `
      <mixer
        :channels="general.project.channels"
        :play="general.play"
        @add="(payload) => general.project.addEffect(payload)"
        @delete="(payload) => general.project.deleteEffect(payload)"
      ></mixer>
      `,
      data: () => ({
        general,
      }),
    });

    ui.panels.push({
      name: 'Mixer',
      component,
    });
  },
});
