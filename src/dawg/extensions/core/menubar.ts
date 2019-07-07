import { manager } from '../manager';
import { IpcRenderer, ElectronMenuItem } from '@/ipc';
import { ipcRenderer } from 'electron';
import { Key } from './commands';

// TODO USE COMMAND
interface SubMenuItem {
  text: string;
  shortcut?: Key[];
  callback: () => void;
}

interface SubMenu {
  name: string;
  items: Array<SubMenuItem | null>;
}

export type Menu = SubMenu[];

export const menubar = manager.activate({
  id: 'dawg.menubar',
  activate() {
    const events: IpcRenderer = ipcRenderer;

    const transform = (menu: string, item: SubMenuItem) => {
      let accelerator: string | undefined;
      if (item.shortcut) {
        accelerator = item.shortcut.join('+');
      }

      return {
        menu,
        label: item.text,
        callback: item.callback,
        accelerator,
      };
    };

    const setMenu = (menu: Menu) => {
      const items: ElectronMenuItem[] = [];
      menu.forEach((submenu) => {
        submenu.items.forEach((item) => {
          if (!item) {
            items.push({
              menu: submenu.name,
              label: null,
            });
            return;
          }

          items.push(transform(submenu.name, item));
        });
      });

      events.send('addToMenu', items);
      events.send('showMenu');
    };

    return {
      setMenu,
      addItem: (menu: string, item: SubMenuItem) => {
        const electronItem = transform(menu, item);
        events.send('addToMenu', electronItem);

        return {
          dispose() {
            events.send('removeFromMenu', electronItem);
          },
        };
      },
    };
  },
});
