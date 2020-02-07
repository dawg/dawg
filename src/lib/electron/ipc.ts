import electron, { Menu, MenuItemConstructorOptions } from 'electron';
import { ElectronMenuBarItem, MainEvents, RendererEvents } from '../ipc-interface';
import { defaultIpcMain } from '../ipc';

defaultIpcMain<MainEvents, RendererEvents>({
  showMenu: (event, payload) => {
    const options = payload.items.map((item): electron.MenuItemConstructorOptions => {
      if (item === null) {
        return {
          type: 'separator',
        };
      }

      return {
        label: item.label,
        accelerator: item.accelerator,
        registerAccelerator: false,
        click: () => {
          event.sender.send('menuCallback', item.uniqueEvent);
        },
      };
    });

    const menu = electron.Menu.buildFromTemplate(options);
    menu.addListener('menu-will-close', () => {
      event.sender.send('closeMenu', payload);
    });

    menu.popup();
  },
  addToMenuBar: (event, itemsOrItem) => {
    const addItem = (item: ElectronMenuBarItem) => {
      const singleMenu = menuLookup[item.menu];
      if (!singleMenu.options.submenu) {
        singleMenu.options.submenu = [];
      }

      if (!Array.isArray(singleMenu.options.submenu)) {
        // This condition should never happen, but we have to satisfy TypeScript
        return;
      }

      if (item.label === null) {
        singleMenu.options.submenu.push({
          type: 'separator',
        });
      } else {
        singleMenu.options.submenu.push({
          label: item.label,
          click: () => {
            event.sender.send('menuBarCallback', item.uniqueEvent);
          },
          accelerator: item.accelerator,
          // The renderer process will be handling this
          // registerAccelerator does not work on MacOS BTW
          // See https://github.com/electron/electron/issues/18295
          registerAccelerator: false,
        });
      }
    };

    if (Array.isArray(itemsOrItem)) {
      itemsOrItem.forEach(addItem);
    } else {
      addItem(itemsOrItem);
    }

    renderMenu();
  },
  removeFromMenuBar: (_, itemsOrItem) => {
    if (Array.isArray(itemsOrItem)) {
      itemsOrItem.forEach(removeItem);
    } else {
      removeItem(itemsOrItem);
    }

    renderMenu();
  },
  // Defines a new menu. If one already exists then nothing happens.
  defineMenu: (_, payload) => {
    if (menuLookup[payload.menu]) {
      return;
    }

    menuLookup[payload.menu] = { options: { label: payload.menu }, order: payload.order };
  },
});

const menuLookup: { [k: string]: { options: MenuItemConstructorOptions, order: number } } = {};

const renderMenu = () => {
  const template = Object.values(menuLookup).sort(
    (a, b) => a.order > b.order ? 1 : -1,
  ).map(({ options }) => options);

  // The first menu item is associated with the application
  // Just look at the menu and you will see what I mean
  if (process.platform === 'darwin') {
    template.unshift({ label: '' });
  }

  // Set the application menu every time.
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

const removeItem = (item: ElectronMenuBarItem) => {
  if (item.label === null) {
    return;
  }

  if (!menuLookup[item.menu]) {
    return;
  }

  const singleMenu = menuLookup[item.menu];
  if (!singleMenu.options.submenu) {
    return;
  }

  if (!Array.isArray(singleMenu.options.submenu)) {
    // this condition should never occur
    return;
  }

  singleMenu.options.submenu = singleMenu.options.submenu.filter((menuItem) => {
    return item.label !== menuItem.label;
  });
};
