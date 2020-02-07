import * as framework from '@/lib/framework';
import { remote } from 'electron';
import { commands } from '@/dawg/extensions/core/commands';
import { menubar } from '@/dawg/extensions/core/menubar';

export const window = framework.manager.activate({
  id: 'dawg.window',
  activate(context) {
    const w = remote.getCurrentWindow();

    const reload = () => {
      w.reload();
    };

    const close = () => {
      w.close();
    };

    context.subscriptions.push(commands.registerCommand({
      text: 'Close Application',
      shortcut: ['CmdOrCtrl', 'W'],
      callback: close,
    }));

    const reloadCommand: framework.Command = {
      text: 'Reload',
      shortcut: ['CmdOrCtrl', 'R'],
      callback: reload,
    };

    const view = menubar.getMenu('View');
    context.subscriptions.push(commands.registerCommand(reloadCommand));
    context.subscriptions.push(view.addItem(reloadCommand));

    return {
      reload,
      close,
    };
  },
});
