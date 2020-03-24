import {
  ElectronMenuOptions,
  ElectronMenuPosition,
  MenuItem,
  MainEvents,
  RendererEvents,
} from '@/lib/ipc-interface';
import { defaultIpcRenderer } from '@/lib/ipc';
import { uniqueId, Key } from '@/lib/std';
import { getLogger } from '@/lib/log';

const logger = getLogger('ipc');

export interface Command<T extends any[]> {
  text: string;
  shortcut?: Key[];
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
    items: opts.items.map((item): MenuItem | null => {
      if (!item) {
        return item;
      }

      const uniqueEvent = uniqueId();
      callbacks[uniqueEvent] = {
        callback: item.callback,
        position: opts.position,
      };

      return {
        type: 'callback',
        label: item.text,
        uniqueEvent,
        accelerator: item.shortcut ? item.shortcut.join('+') : '',
      };
    }),
  };
};

const callbacks: {
  [k: string]: {
    callback: (position: ElectronMenuPosition) => void | undefined,
    position: ElectronMenuPosition,
  },
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

        if (item.type === 'callback') {
          delete callbacks[item.uniqueEvent];
        }
      });
    }, 5000);
  },
  menuBarCallback: (_, uniqueEvent) => {
    const callback = menuBarCallbacks[uniqueEvent];
    logger.debug('MenuBar callback initiated: ' + uniqueEvent);
    callback();
  },
  menuCallback: (_, uniqueEvent) => {
    const { callback, position } = callbacks[uniqueEvent];
    logger.debug('Menu callback initiated: ' + uniqueEvent);
    callback(position);
  },
});
