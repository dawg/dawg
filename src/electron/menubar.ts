'use strict';

import { Menu, MenuItemConstructorOptions } from 'electron';
import { ipcMain, ElectronMenuBarItem } from '../ipc';

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

// Defines a new menu. If one already exists then nothing happens.
ipcMain.on('defineMenu', (_, payload) => {
  if (menuLookup[payload.menu]) {
    return;
  }

  menuLookup[payload.menu] = { options: { label: payload.menu }, order: payload.order };
});

ipcMain.on('addToMenuBar', (event, itemsOrItem) => {
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
});

ipcMain.on('removeFromMenuBar', (_, itemsOrItem) => {
  if (Array.isArray(itemsOrItem)) {
    itemsOrItem.forEach(removeItem);
  } else {
    removeItem(itemsOrItem);
  }

  renderMenu();
});
