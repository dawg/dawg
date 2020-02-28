import Vue from 'vue';
import Mixer from '@/extra/mixer/Mixer.vue';
import * as framework from '@/lib/framework';
import { createExtension } from '@/lib/framework/extensions';
import { commands } from '@/core/commands';
import { project } from '@/core/project';
import * as dawg from '@/dawg';

export const extension = createExtension({
  id: 'dawg.mixer',
  activate(context) {
    context.subscriptions.push(commands.registerCommand({
      text: 'Open Mixer',
      shortcut: ['CmdOrCtrl', 'M'],
      callback: () => {
        framework.ui.openedPanel.value = 'Mixer';
      },
    }));

    const component = Vue.extend({
      components: { Mixer },
      template: `
      <mixer
        :channels="project.channels"
        :play="play"
        @add="(payload) => project.addEffect(payload)"
        @delete="(payload) => project.deleteEffect(payload)"
      ></mixer>
      `,
      data: () => ({
        project,
      }),
      computed:  {
        play: () => {
          return dawg.controls.state.value === 'started';
        },
      },
    });

    framework.ui.panels.push({
      name: 'Mixer',
      component,
    });
  },
});
