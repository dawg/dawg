import * as framework from '@/lib/framework';
import { palette } from '@/core/palette';
import { Key } from '@/lib/std';
import hotkeys from 'hotkeys-js';

type Shortcut = framework.Shortcut;

// See comment below addressing this flag
// Basically, set this flag to false when adding a command to the menubar too
// Defaults to true
interface Command extends framework.Command {
  registerAccelerator?: boolean;
}

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

const cmmds: Command[] = [];
const shorcuts: Shortcut[] = [];

// Why do we need the registerAccelerator flag?
// Because it's currently IMPOSSIBLE to distinguish between a native click and an accelerator in MacOS
// Specifically, we can't differentiate a click on a menu item and an accelerator
// That means we have to support it in the renderer side
// Any command registered in the menubar and here must set registerAccelerator -> false
// More information in the following link:
// See https://github.com/electron/electron/issues/18295
// If this is ever fixed, then we can remove this flag here and always set registerAccelerator -> false
// in the background process ie. in the MenuItemConstructorOptions objects
const pushAndReturnDispose = <T extends Shortcut | Command>(
  items: T[], item: T, { registerAccelerator }: { registerAccelerator: boolean },
) => {
  items.push(item);

  const shortcut = item.shortcut ? item.shortcut.map(((value): string => {
    const hotKey = hotKeysLookup[value];
    if (typeof hotKey === 'string') {
      return hotKey;
    } else {
      return hotKey[framework.platform];
    }
  })).join('+') : undefined;

  if (registerAccelerator && shortcut) {
    hotkeys(shortcut, () => {
      item.callback();
    });
  }


  return {
    dispose() {
      const i = items.indexOf(item);
      if (i < 0) {
        return;
      }

      // Remove command from the list
      items.splice(i, 1);

      if (registerAccelerator && shortcut) {
        hotkeys.unbind(shortcut, item.callback);
      }
    },
  };
};

export const commands = framework.manager.activate({
  id: 'dawg.commands',
  activate(context) {
    const registerCommand = (command: Command) => {
      return pushAndReturnDispose(
        cmmds, command, { registerAccelerator: command.registerAccelerator ?? false },
      );
    };

    const registerShortcut = (shortcut: Shortcut) => {
      return pushAndReturnDispose(shorcuts, shortcut, { registerAccelerator: true });
    };

    context.subscriptions.push({
      dispose() {
        hotkeys.unbind('*');
      },
    });

    const openCommandPalette = framework.defineMenuBarItem({
      menu: 'View',
      section: '0_view',
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
    });

    context.subscriptions.push(registerCommand({ ...openCommandPalette, registerAccelerator: false }));
    context.subscriptions.push(framework.addToMenu(openCommandPalette));

    return {
      registerCommand,
      registerShortcut,
    };
  },
});
