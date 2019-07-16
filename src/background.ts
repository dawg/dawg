'use strict';

import { app, protocol, BrowserWindow, Menu, ipcMain, MenuItemConstructorOptions } from 'electron';
import menu from './main/context';
import path from 'path';
import {
  createProtocol,
  installVueDevtools,
} from 'vue-cli-plugin-electron-builder/lib';
import { IpcMain, ElectronMenuItem } from '@/ipc';

let menuLookup: { [k: string]: MenuItemConstructorOptions } = {};

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

const events = ipcMain as IpcMain;
events.on('removeMenu', () => {
  menuLookup = {};
  Menu.setApplicationMenu(Menu.buildFromTemplate([]));
});

events.on('addToMenu', (event, itemsOrItem) => {
  const addItem = (item: ElectronMenuItem) => {
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
          event.sender.send(item.uniqueEvent);
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

events.on('removeFromMenu', (_, itemsOrItem) => {
  const removeItem = (item: ElectronMenuItem) => {
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

  if (Array.isArray(itemsOrItem)) {
    itemsOrItem.forEach(removeItem);
  } else {
    removeItem(itemsOrItem);
  }

  renderMenu();
});

const isDevelopment = process.env.NODE_ENV !== 'production';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], { secure: true });
function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    minHeight: 600,
    minWidth: 800,
    // @ts-ignore
    icon: path.join(__static as string, 'icon.png'),
  });

  // Make the menu initially not visible
  // Basically, get rid of the default menu
  win.setMenuBarVisibility(false);

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) { win.webContents.openDevTools(); }
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }

  win.on('closed', () => {
    win = null;
  });
}

menu();

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools();
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
