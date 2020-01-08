import * as keyboard from '@/keyboard';
import { manager } from '@/base/manager';
import { palette } from '@/dawg/extensions/core/palette';
import { menubar } from '@/dawg/extensions/core/menubar';
import { Key } from '@/keyboard';
import hotkeys from 'hotkeys-js';
import * as platform from '@/platform';

export type HotKey = string | { [p in platform.Platform]: string };
const hotKeysLookup: { [K in Key]: HotKey } = {
  Shift: 'shift',
  CmdOrCtrl: {
    [platform.Platform.Windows]: 'ctrl',
    [platform.Platform.Mac]: 'command',
    [platform.Platform.Linux]: 'ctrl',
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
  Del: 'delete',
  Tab: 'tab',
  Esc: 'esc',
};

export interface Shortcut {
  shortcut?: keyboard.Key[];
  callback: () => void;
}

export interface Command extends Shortcut {
  text: string;
}

const cmmds: Command[] = [];
const shorcuts: Shortcut[] = [];

const pushAndReturnDispose = (items: Shortcut[], item: Shortcut) => {
  items.push(item);
  const shortcut = item.shortcut ? item.shortcut.map(((value) => hotKeysLookup[value])).join('+') : undefined;
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

export const commands = manager.activate({
  id: 'dawg.commands',
  activate(context) {
    const registerCommand = (command: Command) => {
      return pushAndReturnDispose(cmmds, command);
    };

    const registerShortcut = (shortcut: Shortcut) => {
      return pushAndReturnDispose(shorcuts, shortcut);
    };

    context.subscriptions.push({
      dispose() {
        hotkeys.unbind('*');
      },
    });

    const openCommandPalette: Command = {
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
