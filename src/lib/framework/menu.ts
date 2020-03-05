import { remote } from 'electron';
import { ElectronMenuPosition } from '@/lib/ipc-interface';
import { MenuCommand, MenuOptions, transformMenuOptionsAndSaveCallback, ipcSender } from '@/lib/framework/ipc';

type ContextFunction = (opts: MenuOptions) => void;

const inspect: MenuCommand = {
  text: 'Inspect',
  callback: (e: ElectronMenuPosition) => {
    // Wait for context menu to close before opening the Dev Tools!
    // If you don't, it will focus on the context menu.
    setTimeout(() => {
      const window = remote.getCurrentWindow();
      window.webContents.inspectElement(e.x, e.y);
      if (window.webContents.isDevToolsOpened()) {
        window.webContents.devToolsWebContents.focus();
      }
    }, 1000);
  },
};

const defaultItems =  process.env.NODE_ENV !== 'production' ? [inspect] : [];

export const context: ContextFunction = (opts) => {
  let items = opts.items;
  if (defaultItems.length !== 0) {
    items = [...opts.items, null, ...defaultItems];
  }

  // OK so this is important because in the main process we show a default context menu when we don't prevent it here
  // This is especially important because, on Windows, no menu will show if this function and does not prevent the other
  // event handler from running!!
  opts.position.preventDefault();
  opts.position.stopImmediatePropagation();

  ipcSender.send('showMenu', transformMenuOptionsAndSaveCallback({
    ...opts,
    items,
  }));
};

export const menu: ContextFunction = (opts) => {
  ipcSender.send('showMenu', transformMenuOptionsAndSaveCallback(opts));
};
