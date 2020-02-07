import * as keyboard from '@/styles/keyboard';
import {
  ElectronMenuOptions,
  ElectronMenuPosition,
  ElectronMenuItem,
  MainEvents,
  RendererEvents,
} from '@/ipc-interface';
import { defaultIpcRenderer } from '@/lib/ipc';
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

export const transformMenuOptionsAndSaveCallback = (opts: MenuOptions): ElectronMenuOptions => {
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

const callbacks: {
  [k: string]: { callback: (position: ElectronMenuPosition) => void | undefined, position: ElectronMenuPosition },
} = {};

export const menuBarCallbacks: { [k: string]: () => void | undefined } = {};

export const ipcSender = defaultIpcRenderer<RendererEvents, MainEvents>({
  closeMenu: (_, payload) => {
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
  },
  menuBarCallback: (_, uniqueEvent) => {
    const callback = menuBarCallbacks[uniqueEvent];
    callback();
  },
  menuCallback: (_, uniqueEvent) => {
    const { callback, position } = callbacks[uniqueEvent];
    callback(position);
  },
});
