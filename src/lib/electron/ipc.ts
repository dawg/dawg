import electron, { Menu, MenuItemConstructorOptions } from 'electron';
import { MenuBarItem, MenuBarSections, MainEvents, RendererEvents } from '../ipc-interface';
import { defaultIpcMain } from '../ipc';

export type ElectronMenuItem = {
  type: 'callback';
  label: string;
  accelerator?: string;
  callback: () => void;
} | {
  type: 'role'
  label: string;
  accelerator?: string;
  role: MenuItemConstructorOptions['role'];
};

defaultIpcMain<MainEvents, RendererEvents>({
  showMenu: (event, payload) => {
    const options = payload.items.map((item): electron.MenuItemConstructorOptions => {
      if (item === null) {
        return {
          type: 'separator',
        };
      }

      const opts = item.type === 'callback' ? {
        click: () => {
          event.sender.send('menuCallback', item.uniqueEvent);
        },
      } : {
        role: item.role,
      };

      return {
        ...opts,
        label: item.label,
        accelerator: item.accelerator,
        // This does not work on MacOS. See comment below!
        registerAccelerator: false,
      };
    });

    const menu = electron.Menu.buildFromTemplate(options);
    menu.addListener('menu-will-close', () => {
      event.sender.send('closeMenu', payload);
    });

    menu.popup();
  },
  addToMenuBar: (event, item) => {
    if (item.type === 'callback') {
      untypedMenu[item.menu][item.section].push({
        type: 'callback',
        label: item.label,
        callback: () => {
          event.sender.send('menuBarCallback', item.uniqueEvent);
        },
        accelerator: item.accelerator,
      });
    } else {
      untypedMenu[item.menu][item.section].push({
        type: 'role',
        label: item.label,
        role: item.role,
        accelerator: item.accelerator,
      });
    }

    renderMenu();
  },
  removeFromMenuBar: (_, item) => {
    removeItem(item);
    renderMenu();
  },
});

type MenuOptions<K extends keyof MenuBarSections> = { [S in MenuBarSections[K]]: ElectronMenuItem[]; };

type MenuLookup = {
  [K in keyof MenuBarSections]: MenuOptions<K>;
};

const menuLookup: MenuLookup = {
  Application: {
    '0_commands': [],
  },
  File: {
    '0_newOpen': [],
    '1_save': [],
    '2_exportImport': [],
  },
  Edit: {
    '0_undoRedo': [],
    '1_cutCopyPaste': [
      {
        type: 'role',
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut',
      },
      {
        type: 'role',
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy',
      },
      {
        type: 'role',
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste',
      },
      {
        type: 'role',
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectAll',
      },
    ],
  },
  View: {
    '0_view': [],
  },
  Help: {
    '0_links': [],
    '1_tools': [],
  },
};

// The strictly typed menu is very annoying to use and involves lots of casting
const untypedMenu: { [K: string]: { [S: string]: ElectronMenuItem[]; } } = menuLookup;

const renderMenu = () => {
  const template = Object.keys(menuLookup).map((menuLabel): MenuItemConstructorOptions => {
    const submenu: MenuItemConstructorOptions[] = [];
    Object.keys(untypedMenu[menuLabel]).forEach((section, i) => {
      if (i !== 0) {
        submenu.push({
          type: 'separator',
        });
      }

      untypedMenu[menuLabel][section].forEach((item) => {
        submenu.push({
          label: item.label,
          accelerator: item.accelerator,
          role: item.type === 'role' ? item.role : undefined,
          click: () => {
            if (item.type === 'callback') {
              item.callback();
            }
          },

          registerAccelerator: false,
        });
      });
    });

    return {
      label: menuLabel,
      submenu,
    };
  });

  // Set the application menu every time.
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

const removeItem = <K extends keyof MenuBarSections>(item: MenuBarItem<K>) => {
  untypedMenu[item.menu][item.section] = untypedMenu[item.menu][item.section].filter((menuItem) => {
    return item.label !== menuItem.label;
  });
};
