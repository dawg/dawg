import { shell, remote } from 'electron';
import * as dawg from '@/dawg';

export const extension = dawg.createExtension({
  id: 'dawg.help-inks',
  activate(context) {
    const guide = dawg.menubar.defineMenuBarItem({
      menu: 'Help',
      section: '0_links',
      text: 'Guide',
      callback: () => {
        shell.openExternal('https://dawg.github.io/guide');
      },
    });

    const reportIssue = dawg.menubar.defineMenuBarItem({
      menu: 'Help',
      section: '0_links',
      text: 'Report an Issue',
      callback: () => {
        shell.openExternal('https://github.com/dawg/dawg/issues');
      },
    });

    const devTools = dawg.menubar.defineMenuBarItem({
      menu: 'Help',
      section: '1_tools',
      text: 'Open Developer Tools',
      callback: () => {
        const window = remote.getCurrentWindow();
        window.webContents.openDevTools();
      },
    });

    [guide, reportIssue, devTools].forEach((command) => {
      context.subscriptions.push(dawg.menubar.addToMenu(command));
    });
  },
});
