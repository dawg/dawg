import { Key } from '@/lib/std';
import { uniqueId } from '@/lib/std';
import { menuBarCallbacks, ipcSender } from '@/lib/framework/ipc';

export interface Shortcut {
  shortcut?: Key[];
  callback: () => void;
}

export interface Command extends Shortcut {
  text: string;
}

interface SubMenu {
  name: string;
  items: Array<Command | null>;
}

export type Menu = SubMenu[];

const transform = (menu: string, item: Command) => {
  let accelerator: string | undefined;
  if (item.shortcut) {
    accelerator = item.shortcut.join('+');
  }

  const uniqueEvent = uniqueId();
  menuBarCallbacks[uniqueEvent] = item.callback;

  return {
    menu,
    label: item.text,
    uniqueEvent,
    accelerator,
  };
};

export const defineMenu = (o: { menu: string, order: number }) => {
  ipcSender.send('defineMenu', o);
  return {
    addToMenu: (item: Command) => {
      const electronItem = transform(o.menu, item);
      ipcSender.send('addToMenuBar', electronItem);

      return {
        dispose() {
          ipcSender.send('removeFromMenuBar', electronItem);
          delete menuBarCallbacks[electronItem.uniqueEvent];
        },
      };
    },
  };
};
