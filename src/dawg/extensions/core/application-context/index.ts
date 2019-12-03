import Vue from 'vue';
import VerticalSwitch from '@/dawg/extensions/core/application-context/VerticalSwitch.vue';
import { manager } from '@/base/manager';
import { ref } from '@vue/composition-api';
import * as base from '@/base';
import { commands } from '@/dawg/extensions/core/commands';

export type ApplicationContext = 'playlist' | 'pianoroll';

export const applicationContext = manager.activate({
  id: 'dawg.application-context',
  activate(context) {
    const c = ref<ApplicationContext>('pianoroll');

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

    base.ui.toolbar.push({
      position: 'right',
      component,
      order: 1,
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
