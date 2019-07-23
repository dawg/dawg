'use strict';

import { Menu, MenuItemConstructorOptions } from 'electron';
import { ipcMain, ElectronMenuBarItem } from '../ipc';

const menuLookup: { [k: string]: MenuItemConstructorOptions } = {};

const renderMenu = () => {
  const template = Object.values(menuLookup);

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
  if (!singleMenu.submenu) {
    return;
  }

  if (!Array.isArray(singleMenu.submenu)) {
    // this condition should never occur
    return;
  }

  singleMenu.submenu = singleMenu.submenu.filter((menuItem) => {
    return item.label !== menuItem.label;
  });
};

ipcMain.on('addToMenuBar', (event, itemsOrItem) => {
  const addItem = (item: ElectronMenuBarItem) => {
    if (!menuLookup[item.menu]) {
      menuLookup[item.menu] = {
        label: item.menu,
      };
    }

    const singleMenu = menuLookup[item.menu];
    if (!singleMenu.submenu) {
      singleMenu.submenu = [];
    }

    if (!Array.isArray(singleMenu.submenu)) {
      // This condition should never happen, but we have to satisfy TypeScript
      return;
    }

    if (item.label === null) {
      singleMenu.submenu.push({
        type: 'separator',
      });
    } else {
      singleMenu.submenu.push({
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
