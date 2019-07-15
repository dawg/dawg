import { manager } from '@/dawg/extensions/manager';
import { IpcRenderer, ElectronMenuItem } from '@/ipc';
import { ipcRenderer } from 'electron';
import { Key } from './commands';
import { uniqueId } from '@/utils';

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

// TODO(jacob) Make this structure...
// [
//   this.menuItems.new,
//   null,
//   this.menuItems.open,
//   this.menuItems.backup,
//   null,
//   // TODO(jacob)
//   // this.menuItems.addFolder,
//   null,
//   this.menuItems.save,
//   this.menuItems.saveAs,
// ],

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
        uniqueEvent: uniqueId(),
        accelerator,
      };
    };

    return {
      addItem: (menu: string, item: SubMenuItem) => {
        const electronItem = transform(menu, item);
        events.send('addToMenu', electronItem);

        // This solution is a bit weird but it works
        // You can't pass functions, so we create a unique ID and add a listener
        events.on(electronItem.uniqueEvent as any, () => {
          item.callback();
        });

        return {
          dispose() {
            events.send('removeFromMenu', electronItem);
            events.removeAllListeners(electronItem.uniqueEvent as any);
          },
        };
      },
    };
  },
});
