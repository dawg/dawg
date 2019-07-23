import * as t from 'io-ts';
import { createExtension } from '@/dawg/extensions';
import { manager } from '@/base/manager';

// TODO sync base stuff to FS
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
