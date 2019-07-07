import { Platform, platform } from '@/dawg/platform';
import { manager } from '@/dawg/extensions/manager';
import { palette } from './palette';
import { menubar } from './menubar';

type CommandCallback = () => void;

export type Key =
  'Shift' |
  'CmdOrCtrl' |
  'A' |
  'B' |
  'C' |
  'D' |
  'E' |
  'F' |
  'G' |
  'H' |
  'I' |
  'J' |
  'K' |
  'L' |
  'M' |
  'N' |
  'O' |
  'P' |
  'Q' |
  'R' |
  'S' |
  'T' |
  'U' |
  'V' |
  'W' |
  'X' |
  'Y' |
  'Z' |
  'Space' |
  'Del' |
  'Esc' |
  'Tab';

type KeyCode = number | { [p in Platform]: number };
type KeyCodeLookup = { [k in Key]: KeyCode };

const codeLookup: KeyCodeLookup = {
  Shift: 16,
  CmdOrCtrl: {
    [Platform.Windows]: 17,
    [Platform.Mac]: 91,
    [Platform.Linux]: 17,
  }, // 55 is the Mac command key
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  Space: 32,
  Del: 46,
  Tab: 9,
  Esc: 27.,
};

function shortcutPressed(shortcut: Key[], pressedKeys: Set<number>) {
  if (pressedKeys.size !== shortcut.length) {
    return false;
  }

  // Just to be sure. I think the previous if statement is fine though.
  if (shortcut.length === 0) {
    return false;
  }

  const has = (code: KeyCode) => {
    // Here we account for platform specific codes
    // ie ctrl for windows and command for macs
    if (typeof code === 'object') {
      code = code[platform];
    }

    return pressedKeys.has(code);
  };

  if (!shortcut.every((key) => has(codeLookup[key]))) {
    return false;
  }

  return true;
}

export class KeyboardShortcuts {
  public pressedKeys = new Set<number>();
  private boundKeydown: (e: KeyboardEvent) => void;
  private boundKeyup: (e: KeyboardEvent) => void;

  constructor() {
    this.boundKeydown = this.keydown.bind(this);
    this.boundKeyup = this.keyup.bind(this);
    window.addEventListener('keydown', this.boundKeydown);
    window.addEventListener('keyup', this.boundKeyup);
  }

  public clear() {
    this.pressedKeys.clear();
  }

  public keydown(e: KeyboardEvent) {
    // We do not add the enter key since it will never be used in a shortcut and causes bugs
    // For example, if we open the file dialog, keyup is never fired for enter.
    if (e.which !== 13) { // ENTER
      this.pressedKeys.add(e.which);
    }

    items.forEach((item) => {
      if (!item.shortcut) {
        return;
      }

      if (shortcutPressed(item.shortcut, this.pressedKeys)) {
        e.preventDefault();
        item.callback();
      }
    });
  }

  public keyup(e: KeyboardEvent) {
    this.pressedKeys.delete(e.which);
  }

  public dispose() {
    window.removeEventListener('keydown', this.boundKeydown);
    window.removeEventListener('keyup', this.boundKeyup);
  }
}

const items: Command[] = [];

export interface Command {
  text: string;
  shortcut?: Key[]; // TODO
  callback: CommandCallback;
}

class CommandManager {
  constructor(private command: Command) {
    items.push(command);
  }

  public dispose() {
    const i = items.indexOf(this.command);
    if (i < 0) {
      return;
    }

    // Remove command from the list
    items.splice(i, 1);
  }
}

export const commands = manager.activate({
  id: 'dawg.commands',
  activate(context) {
    context.subscriptions.push(new KeyboardShortcuts());

    const registerCommand = (command: Command) => {
      return new CommandManager(command);
    };

    const openCommandPalette: Command = {
      text: 'Command Palette',
      shortcut: ['CmdOrCtrl', 'Shift', 'P'],
      callback: () => {
        palette.selectFromItems(items, {
          onDidSelect: (item) => {
            item.callback();
          },
        });
      },
    };

    registerCommand(openCommandPalette);
    context.subscriptions.push(menubar.addItem('View', openCommandPalette));

    return {
      registerCommand,
      clear() {
        // bus.$emit('clear');
      },
    };
  },
});
