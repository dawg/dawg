import electron from 'electron';
import { ipcMain } from '../ipc';

ipcMain.on('showMenu', (event, payload) => {
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
        event.sender.send('menuCallback', item.uniqueEvent, payload.position);
      },
    };
  });

  const menu = electron.Menu.buildFromTemplate(options);
  menu.addListener('menu-will-close', () => {
    event.sender.send('closeMenu', payload);
  });

  menu.popup({
    ...payload.position,
  });
});
