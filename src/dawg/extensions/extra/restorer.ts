import * as t from '@/io';
import * as dawg from '@/dawg';
import * as framework from '@/framework';
import { watch, Ref } from '@vue/composition-api';
import { createExtension } from '@/framework/extensions';

export const extension = createExtension({
  id: 'dawg.restorer',
  workspace: {
    openedSideTab: t.string,
    openedPanel: t.string,
    sideBarCollapsed: t.boolean,
    sideBarSize: {
      type: t.number,
      default: 250,
    },
    panelsCollapsed: t.boolean,
    panelsSize: {
      type: t.number,
      default: 250,
    },
  },
  activate(context) {
    const sync = <T>(from: Ref<T>, to: Ref<T>) => {
      from.value = to.value;
      watch(from, () => {
        to.value = from.value;
      });
    };

    // watch everything for changes
    sync(framework.ui.openedSideTab, context.workspace.openedSideTab);
    sync(framework.ui.openedPanel, context.workspace.openedPanel);
    sync(framework.ui.sideBarSize, context.workspace.sideBarSize);
    sync(framework.ui.panelsSize, context.workspace.panelsSize);
    sync(framework.ui.sideBarCollapsed, context.workspace.sideBarCollapsed);
    sync(framework.ui.panelsCollapsed, context.workspace.panelsCollapsed);

    context.subscriptions.push(dawg.commands.registerCommand({
      text: 'Toggle Panels',
      shortcut: ['CmdOrCtrl', 'J'],
      callback: () => {
        framework.ui.panelsCollapsed.value = !framework.ui.panelsCollapsed.value;
      },
    }));

    context.subscriptions.push(dawg.commands.registerCommand({
      text: 'Toggle Side Tabs',
      shortcut: ['CmdOrCtrl', 'B'],
      callback: () => {
        framework.ui.sideBarCollapsed.value = !framework.ui.sideBarCollapsed.value;
      },
    }));
  },
});
