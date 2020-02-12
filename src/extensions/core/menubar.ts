import * as framework from '@/lib/framework';
import { keys, fromEntries } from '@/lib/std';

// TODO Make this structure...
// [
//   this.menuItems.new,
//   null,
//   this.menuItems.open,
//   this.menuItems.backup,
//   null,
//   this.menuItems.addFolder,
//   null,
//   this.menuItems.save,
//   this.menuItems.saveAs,
// ],

type MenuNames = 'File' | 'Edit' | 'View' | 'Help';

export const menubar = framework.manager.activate({
  id: 'dawg.menubar',
  activate() {
    const menus: { [K in MenuNames]: framework.Menu } = {
      File: [],
      Edit: [],
      View: [],
      Help: [],
    };

    const lookup = fromEntries(keys(menus).map((menu, i) => {
      return [menu, framework.defineMenu({ menu, order: i })];
    }));

    return {
      getMenu(menu: MenuNames) {
        return {
          alreadyDefined: false,
          addItem: (item: framework.Command) => {
            return lookup[menu].addToMenu(item);
          },
        };
      },
    };
  },
});
