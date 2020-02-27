import Vue from 'vue';
import VerticalSwitch from '@/core/controls/VerticalSwitch.vue';
import * as framework from '@/lib/framework';
import { createComponent, computed, ref, watch } from '@vue/composition-api';
import { commands } from '@/core/commands';
import * as t from '@/lib/io';
import * as dawg from '@/dawg';
import { patterns as patternsExtension } from '@/core/patterns';

const applicationContextType = t.union([t.literal('playlist'), t.literal('pianoroll')]);
export type ApplicationContext = t.TypeOf<typeof applicationContextType>;

export const controls = framework.manager.activate({
  id: 'dawg.controls',
  workspace: {
    context: {
      type: applicationContextType,
      default: 'pianoroll',
    } as const,
  },
  activate(context) {
    const c = context.workspace.context;
    const state = ref<'stopped' | 'started' | 'paused'>('stopped');

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

    framework.ui.toolbar.push({
      position: 'right',
      component,
      order: 1,
    });

    context.subscriptions.push(commands.registerCommand({
      type: 'callback',
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

    const stop = Vue.extend(createComponent({
      props: {},
      template: `
      <dg-mat-icon class="text-default cursor-pointer" icon="stop"></dg-mat-icon>
      `,
    }));

    dawg.ui.toolbar.push({
      component: stop,
      position: 'right',
      order: 2,
    });

    const playPauseComponent = Vue.extend(createComponent({
      props: {},
      template: `
      <dg-mat-icon class="text-default cursor-pointer" :icon="icon" @click="toggle"></dg-mat-icon>
      `,
      setup() {
        return {
          toggle: () => {
            playPause();
          },
          icon: computed(() => {
            return state.value === 'started' ? 'pause' : 'play_arrow';
          }),
        };
      },
    }));

    dawg.ui.toolbar.push({
      component: playPauseComponent,
      position: 'right',
      order: 3,
    });

    function playPause() {
      if (!transport.value) {
        dawg.notify.warning('Please select a Pattern.', {
          detail: 'Please create and select a `Pattern` first or switch the `Playlist` context.',
          action: { label: 'Open Playlist Tab', callback: () => patternsExtension.openPatternsTab() },
        });
        return;
      }

      if (transport.value.state === 'started') {
        pause();
      } else {
        startTransport();
      }
    }

    function pause() {
      if (!transport.value) {
        return;
      }

      transport.value.stop();
      state.value = 'paused';
    }

    function getTime() {
      if (!transport.value) {
        return 0;
      }

      return transport.value.seconds;
    }

    function startTransport() {
      if (!transport.value) {
        return;
      }

      transport.value.start();
      state.value = 'started';
    }

    function stopIfStarted() {
      if (transport.value && transport.value.state === 'started') {
        stopTransport();
      }
    }

    function stopTransport() {
      if (!transport.value) {
        return;
      }

      transport.value.stop();
      state.value = 'stopped';
    }

    const transport = computed(() => {
      if (c.value === 'pianoroll') {
        const pattern = patternsExtension.selectedPattern;
        return pattern.value ? pattern.value.transport : null;
      } else {
        return dawg.project.master.transport;
      }
    });

    // Pause every time the context changes
    watch(c, () => {
      pause();
    });

    context.subscriptions.push(commands.registerCommand({
      type: 'callback',
      text: 'Play/Pause',
      shortcut: ['Space'],
      callback: playPause,
    }));

    return {
      context: c,
      getTime,
      startTransport,
      stopIfStarted,
      stopTransport,
      state,
    };
  },
});
