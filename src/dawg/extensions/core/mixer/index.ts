import Vue from 'vue';
import Mixer from '@/dawg/extensions/core/mixer/Mixer.vue';
import { ui } from '@/dawg/ui';
import { createExtension } from '@/dawg/extensions';
import { commands } from '@/dawg/extensions/core/commands';
import { panels } from '@/dawg/extensions/core/panels';
import { project } from '@/dawg/extensions/core/project';

export const extension = createExtension({
  id: 'dawg.mixer',
  activate(context) {
    context.subscriptions.push(commands.registerCommand({
      text: 'Open Mixer',
      shortcut: ['CmdOrCtrl', 'M'],
      callback: () => {
        panels.openedPanel.value = 'Mixer';
      },
    }));

    const component = Vue.extend({
      components: { Mixer },
      template: `
      <mixer
        :channels="project.project.channels"
        :play="play"
        @add="(payload) => project.project.addEffect(payload)"
        @delete="(payload) => project.project.deleteEffect(payload)"
      ></mixer>
      `,
      data: () => ({
        project,
      }),
      computed:  {
        play: () => {
          return project.state.value === 'started';
        },
      },
    });

    ui.panels.push({
      name: 'Mixer',
      component,
    });
  },
});
