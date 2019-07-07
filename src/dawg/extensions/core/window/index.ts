import { manager } from '../../manager';
import { remote } from 'electron';
import { commands } from '../commands';

export const window = manager.activate({
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

    // TODO(jacob) Add to file menu
    context.subscriptions.push(commands.registerCommand({
      text: 'Reload',
      shortcut: ['CmdOrCtrl', 'R'],
      callback: reload,
    }));

    return {
      reload,
      close,
    };
  },
});
