import { Key } from '@/lib/std';
import { uniqueId } from '@/lib/std';
import { menuBarCallbacks, ipcSender } from '@/lib/framework/ipc';
import { MenuBarSections, MenuBarItem } from '@/lib/ipc-interface';
import { MenuItemConstructorOptions } from 'electron';

export interface CallbackShortcut {
  type: 'callback';
  shortcut?: Key[];
  callback: () => void;
}

export interface RoleShortcut {
  type: 'role';
  shortcut?: Key[];
  role: MenuItemConstructorOptions['role'];
}

export type Shortcut = CallbackShortcut | RoleShortcut;

export type Command = Shortcut & {
  text: string;
};

export type MenuBarItemOptions<K extends keyof MenuBarSections> = Command & {
  menu: K;
  section: MenuBarSections[K];
};

export const defineMenuBarItem = <K extends keyof MenuBarSections>(o: MenuBarItemOptions<K>) => {
  return o;
};

export const addToMenu = <K extends keyof MenuBarSections>(item: MenuBarItemOptions<K>) => {
  let accelerator: string | undefined;
  if (item.shortcut) {
    accelerator = item.shortcut.join('+');
  }

  if (item.type === 'role') {
    return {
      dispose: () => ({}),
    };
  }

  const uniqueEvent = uniqueId();
  menuBarCallbacks[uniqueEvent] = item.callback;

  const electronItem: MenuBarItem<K> = {
    type: 'callback',
    menu: item.menu,
    section: item.section,
    label: item.text,
    accelerator,
    uniqueEvent,
  };

  ipcSender.send('addToMenuBar', electronItem);
  return {
    dispose() {
      ipcSender.send('removeFromMenuBar', electronItem);
      delete menuBarCallbacks[electronItem.uniqueEvent];
    },
  };
};
