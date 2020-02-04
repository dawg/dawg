import Vue from 'vue';
import Mixer from '@/dawg/extensions/extra/mixer/Mixer.vue';
import * as framework from '@/framework';
import { createExtension } from '@/framework/extensions';
import { commands } from '@/dawg/extensions/core/commands';
import { project } from '@/dawg/extensions/core/project';
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
