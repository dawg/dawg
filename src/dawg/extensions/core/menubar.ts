import { manager } from '../manager';
import { IpcRenderer, ElectronMenuItem } from '@/ipc';
import { ipcRenderer } from 'electron';
import { Key } from './commands';

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
    const setMenu = (menu: Menu) => {
      const events: IpcRenderer = ipcRenderer;

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

          let accelerator: string | undefined;
          if (item.shortcut) {
            accelerator = item.shortcut.join('+');
          }

          items.push({
            menu: submenu.name,
            label: item.text,
            callback: item.callback,
            accelerator,
          });
        });
      });

      events.send('removeMenu');
      events.send('addToMenu', items);
    };

    return {
      setMenu,
    };
  },
});
