import Vue from 'vue';
import VerticalSwitch from '@/dawg/extensions/core/application-context/VerticalSwitch.vue';
import { manager } from '@/dawg/extensions/manager';
import { value } from 'vue-function-api';
import { ui } from '@/dawg/base/ui';
import { commands } from '@/dawg/extensions/core/commands';

export type ApplicationContext = 'playlist' | 'pianoroll';

export const applicationContext = manager.activate({
  id: 'dawg.application-context',
  activate(context) {
    const c = value<ApplicationContext>('pianoroll');

    const component = Vue.extend({
      name: 'VerticalSwitchWrapper',
      components: { VerticalSwitch },
      template: `<vertical-switch :top="sliderTop" @update:top="update"></vertical-switch>`,
      methods:  {
        update(isTop: boolean) {
          c.value = isTop ? 'playlist' : 'pianoroll';
        },
      },
      computed: {
        sliderTop: () => {
          return c.value === 'playlist';
        },
      },
    });

    ui.toolbar.push({
      position: 'right',
      component,
    });

    context.subscriptions.push(commands.registerCommand({
      text: 'Switch Context',
      shortcut: ['Ctrl', 'Tab'],
      callback: () => {
        if (c.value === 'pianoroll') {
          c.value = 'playlist';
        } else {
          c.value = 'pianoroll';
        }
      },
    }));

    return {
      context: c,
    };
  },
});
