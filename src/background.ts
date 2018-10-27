'use strict';

import { app, protocol, BrowserWindow, dialog, shell, Menu } from 'electron';
import menu from 'electron-context-menu';
import * as path from 'path';
import { format as formatUrl } from 'url';
import {
  createProtocol,
  installVueDevtools,
} from 'vue-cli-plugin-electron-builder/lib';
const isDevelopment = process.env.NODE_ENV !== 'production';
if (isDevelopment) {
  // Don't load any native (external) modules until the following line is run:

  // tslint:disable-next-line:no-var-requires
  require('module').globalPaths.push(process.env.NODE_MODULES_PATH);
}

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: any;

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], { secure: true });
function createMainWindow() {
  const window = new BrowserWindow();

  if (isDevelopment) {
    // Load the url of the dev server if in development mode
    window.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) { window.webContents.openDevTools(); }
  } else {
    createProtocol('app');
    //   Load the index.html when not in development
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true,
      }),
    );
  }

  window.on('closed', () => {
    mainWindow = null;
  });

  window.webContents.on('devtools-opened', () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  return window;
}

const setMainMenu = () => {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click() {
            //
          },
        },
        {
          label: 'Add Folder to Project',
          click() {
            const folder = dialog.showOpenDialog({properties: ['openDirectory']}); // We only ever get one folder
            mainWindow.webContents.send('folder', folder);
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {role: 'undo'},
        {role: 'redo'},
        {type: 'separator'},
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {role: 'pasteandmatchstyle'},
        {role: 'delete'},
        {role: 'selectall'},
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click() { shell.openExternal('https://github.com/vuesic/vuesic'); },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

menu({
  labels: {
    cut: 'Configured Cut',
    copy: 'Configured Copy',
    paste: 'Configured Paste',
    save: 'Configured Save Image',
    copyLink: 'Configured Copy Link',
    copyImageAddress: 'Configured Copy Image Address',
    inspect: 'Configured Inspect',
  },
});

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// create main BrowserWindow when electron is ready
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    await installVueDevtools();
  }
  mainWindow = createMainWindow();
});
