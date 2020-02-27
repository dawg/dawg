import { Key } from '@/lib/std';
import { uniqueId } from '@/lib/std';
import { menuBarCallbacks, ipcSender } from '@/lib/framework/ipc';
import { MenuBarSections, MenuBarItem } from '@/lib/ipc-interface';

export interface Shortcut {
  shortcut: Key[];
  callback: () => void;
}

export interface Command  {
  shortcut?: Key[];
  callback: () => void;
  text: string;
}

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
