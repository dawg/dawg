import * as t from 'io-ts';
import { manager } from '@/base/manager';

// TODO
export const panels = manager.activate({
  id: 'dawg.panels',
  workspace: {
    openedPanel: t.string,
  },
  activate(context) {
    return {
      openedPanel: context.workspace.openedPanel,
    };
  },
});
