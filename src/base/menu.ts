import * as keyboard from '@/base/keyboard';
import { remote } from 'electron';
import { ipcRenderer, ElectronMenuOptions, ElectronMenuPosition, ElectronMenuItem } from '@/ipc';
import { uniqueId } from '@/utils';

export interface Command<T extends any[]> {
  text: string;
  shortcut?: keyboard.Key[];
  callback: (...args: T) => void;
}

export type MenuCommand = Command<[ElectronMenuPosition]>;

export interface MenuOptions {
  position: ElectronMenuPosition;
  items: Array<MenuCommand | null>;
  left?: boolean;
}

const transform = (opts: MenuOptions): ElectronMenuOptions => {
  return {
    ...opts,
    items: opts.items.map((item): ElectronMenuItem | null => {
      if (!item) {
        return item;
      }

      const uniqueEvent = uniqueId();
      callbacks[uniqueEvent] = {
        callback: item.callback,
        position: opts.position,
      };

      return {
        label: item.text,
        uniqueEvent,
        accelerator: item.shortcut ? item.shortcut.join('+') : '',
      };
    }),
  };
};

type ContextFunction = (opts: MenuOptions) => void;

// FIXME remove
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

const callbacks: {
  [k: string]: { callback: (position: ElectronMenuPosition) => void | undefined, position: ElectronMenuPosition },
} = {};

const defaultItems =  process.env.NODE_ENV !== 'production' ? [inspect] : [];

ipcRenderer.on('menuCallback', (_, uniqueEvent) => {
  const { callback, position } = callbacks[uniqueEvent];
  callback(position);
});

ipcRenderer.on('closeMenu', (_, payload) => {
  // Ok so the only reason we are doing this is to clean up after ourselves.
  // There is not reason we have to do it immediately so we delay by 5 seconds.
  // We do this because this event is fired before menuCallback, thus, the callbacks
  // are deleted before the 'menuCallback' callback function is called!
  setTimeout(() => {
    payload.items.forEach((item) => {
      if (!item) {
        return;
      }

      delete callbacks[item.uniqueEvent];
    });
  }, 5000);
});

export const context: ContextFunction = (opts) => {
  let items = opts.items;
  if (defaultItems.length !== 0) {
    items = [...opts.items, null, ...defaultItems];
  }

  ipcRenderer.send('showMenu', transform({
    ...opts,
    items,
  }));
};

export const menu: ContextFunction = (opts) => {
  ipcRenderer.send('showMenu', transform(opts));
};
