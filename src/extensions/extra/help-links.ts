import { menubar } from '@/extensions/core/menubar';
import { shell, remote } from 'electron';
import { createExtension } from '@/lib/framework/extensions';

export const extension = createExtension({
  id: 'dawg.help-inks',
  activate(context) {
    const commands = [
      {
        text: 'Guide',
        callback: () => {
          shell.openExternal('https://dawg.github.io/guide');
        },
      },
      {
        text: 'Report an Issue',
        callback: () => {
          shell.openExternal('https://github.com/dawg/vusic/issues');
        },
      },
      {
        text: 'Trello Board',
        callback: () => {
          shell.openExternal('https://trello.com/b/ZOLQJGSv/vusic-feature-requests');
        },
      },
      // FIXME add back null
      // null,
      {
        text: 'Open Developer Tools',
        callback: () => {
          const window = remote.getCurrentWindow();
          window.webContents.openDevTools();
        },
      },
    ];

    const help = menubar.getMenu('Help');
    commands.forEach((command) => {
      context.subscriptions.push(help.addItem(command));
    });
  },
});
