import { manager } from '@/dawg/extensions/manager';
import { menubar } from './menubar';
import { shell, remote } from 'electron';

export const helpLinks = manager.activate({
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
      // TODO(jacob) add back null
      // null,
      {
        text: 'Open Developer Tools',
        callback: () => {
          const window = remote.getCurrentWindow();
          window.webContents.openDevTools();
        },
      },
    ];

    commands.forEach((command) => {
      context.subscriptions.push(menubar.addItem('Help', command));
    });
  },
});
