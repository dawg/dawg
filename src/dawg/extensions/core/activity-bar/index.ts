// FIXME For some reason, it only works if I place this Vue.use statement here
import Vue from 'vue';
import { plugin } from 'vue-function-api';
Vue.use(plugin);

import * as t from 'io-ts';
import { createExtension } from '@/dawg/extensions';
import { manager } from '@/dawg/extensions/manager';

const extension = createExtension({
  id: 'dawg.activity-bar',
  workspace: {
    openedSideTab: t.string,
  },
  activate(context) {
    return {
      openedSideTab: context.workspace.openedSideTab,
    };
  },
});

export const activityBar = manager.activate(extension);
