import * as framework from '@/lib/framework';
import { palette } from '@/core/palette';
import { menubar } from '@/core/menubar';
import { Key } from '@/lib/std';
import hotkeys from 'hotkeys-js';

export type HotKey = string | { [p in framework.Platform]: string };
const hotKeysLookup: { [K in Key]: HotKey } = {
  Shift: 'shift',
  CmdOrCtrl: {
    [framework.Platform.Windows]: 'ctrl',
    [framework.Platform.Mac]: 'command',
    [framework.Platform.Linux]: 'ctrl',
  },
  AltOrOption: {
    [framework.Platform.Windows]: 'alt',
    [framework.Platform.Mac]: 'option',
    [framework.Platform.Linux]: 'alt',
  },
  Ctrl: 'ctrl',
  A: 'a',
  B: 'b',
  C: 'c',
  D: 'd',
  E: 'e',
  F: 'f',
  G: 'g',
  H: 'h',
  I: 'i',
  J: 'j',
  K: 'k',
  L: 'l',
  M: 'm',
  N: 'n',
  O: 'o',
  P: 'p',
  Q: 'q',
  R: 'r',
  S: 's',
  T: 't',
  U: 'u',
  V: 'v',
  W: 'w',
  X: 'x',
  Y: 'y',
  Z: 'z',
  Space: 'space',
  Delete: 'delete',
  Tab: 'tab',
  Esc: 'esc',
  Backspace: 'backspace',
  Cmd: 'command',
  Return: 'enter',
  Left: 'left',
  Up: 'up',
  Right: 'right',
  Down: 'down',
};

const cmmds: framework.Command[] = [];
const shorcuts: framework.Shortcut[] = [];

const pushAndReturnDispose = (items: framework.Shortcut[], item: framework.Shortcut) => {
  items.push(item);
  const shortcut = item.shortcut ? item.shortcut.map(((value): string => {
    const hotKey = hotKeysLookup[value];
    if (typeof hotKey === 'string') {
      return hotKey;
    } else {
      return hotKey[framework.platform];
    }
  })).join('+') : undefined;
  if (shortcut) {
    hotkeys(shortcut, item.callback);
  }


  return {
    dispose() {
      const i = items.indexOf(item);
      if (i < 0) {
        return;
      }

      // Remove command from the list
      items.splice(i, 1);

      if (shortcut) {
        hotkeys.unbind(shortcut, item.callback);
      }
    },
  };
};

export const commands = framework.manager.activate({
  id: 'dawg.commands',
  activate(context) {
    const registerCommand = (command: framework.Command) => {
      return pushAndReturnDispose(cmmds, command);
    };

    const registerShortcut = (shortcut: framework.Shortcut) => {
      return pushAndReturnDispose(shorcuts, shortcut);
    };

    context.subscriptions.push({
      dispose() {
        hotkeys.unbind('*');
      },
    });

    const openCommandPalette: framework.Command = {
      text: 'Command Palette',
      shortcut: ['CmdOrCtrl', 'Shift', 'P'],
      callback: () => {
        const paletteItems = cmmds.map((item) => ({
          ...item,
          action: item.shortcut ? item.shortcut.join('+') : undefined,
        })).filter((o) => o.text); // we just are filtering out the empty strings here

        palette.selectFromItems(paletteItems, {
          onDidInput: (item) => {
            item.callback();
          },
        });
      },
    };

    registerCommand(openCommandPalette);
    const view = menubar.getMenu('View');
    context.subscriptions.push(view.addItem(openCommandPalette));

    return {
      registerCommand,
      registerShortcut,
    };
  },
});
