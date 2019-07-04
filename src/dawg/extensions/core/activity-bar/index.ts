// TODO REMOVE THIS
import Vue from 'vue';
import { plugin } from 'vue-function-api';
Vue.use(plugin);

import { Extension, IExtensionContext } from '@/dawg/extensions';
import { manager } from '@/dawg/extensions/manager';
import { Wrapper, value, watch } from 'vue-function-api';

class ActivityBar {
  constructor(public readonly openedSideTab: Wrapper<string | undefined>) {}
}

const extension: Extension<{ openedSideTab: string }, {}, {}, ActivityBar> = {
  id: 'dawg.activity-bar',
  activate(context) {
    const openedSideTab = value<string | undefined>(context.workspace.get('openedSideTab'));

    watch(openedSideTab, () => {
      if (openedSideTab.value !== undefined) {
        context.workspace.set('openedSideTab', openedSideTab.value);
        context.workspace.remove('openedSideTab');
      }
    });

    return new ActivityBar(openedSideTab);
  },
};

export const activityBar = manager.activate(extension);
