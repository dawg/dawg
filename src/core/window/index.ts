import * as framework from '@/lib/framework';
import { remote } from 'electron';
import { commands } from '@/core/commands';

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

    const reloadCommand = framework.defineMenuBarItem({
      menu: 'Application',
      section: '0_commands',
      text: 'Reload',
      shortcut: ['CmdOrCtrl', 'R'],
      callback: reload,
    });

    context.subscriptions.push(commands.registerCommand({ ...reloadCommand, registerAccelerator: false }));
    context.subscriptions.push(framework.addToMenu(reloadCommand));

    return {
      reload,
      close,
    };
  },
});
