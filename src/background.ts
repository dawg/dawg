import { app, protocol, BrowserWindow } from 'electron';
import menu from './lib/electron/context';
import path from 'path';
import {
  createProtocol,
  installVueDevtools,
} from 'vue-cli-plugin-electron-builder/lib';
import './lib/electron/ipc';
import { isDevelopment } from './lib/electron/environment';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

// Standard scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{
  scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true },
}]);
function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    title: 'DAWG',
    width: 800,
    height: 600,
    minHeight: 600,
    minWidth: 800,
    // @ts-ignore
    icon: path.join(__static as string, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // Make the menu initially not visible
  // Basically, get rid of the default menu
  win.setMenuBarVisibility(false);

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
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

menu({ showInspectElement: true });

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
      console.error('Vue DevTools failed to install:', e.toString());
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
