import * as keyboard from '@/keyboard';
import { manager } from '@/base/manager';
import { palette } from '@/dawg/extensions/core/palette';
import { menubar } from '@/dawg/extensions/core/menubar';
import { Key, hasKey } from '@/keyboard';

export interface Shortcut {
  shortcut?: keyboard.Key[];
  callback: () => void;
}

export interface Command extends Shortcut {
  text: string;
}

function shortcutPressed(shortcut: Key[], pressedKeys: Set<number>) {
  if (pressedKeys.size !== shortcut.length) {
    return false;
  }

  // Just to be sure. I think the previous if statement is fine though.
  if (shortcut.length === 0) {
    return false;
  }

  if (!shortcut.every((key) => hasKey(pressedKeys, key))) {
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
    e.preventDefault();

    // ignore all targets that aren't the body
    // For example, ignore keys typed in an input
    // This won't work
    if (e.target !== document.body) {
      return;
    }

    // We do not add the enter key since it will never be used in a shortcut and causes bugs
    // For example, if we open the file dialog, keyup is never fired for enter.
    if (e.which !== 13) { // ENTER
      this.pressedKeys.add(e.which);
    }

    const check = (item: Shortcut) => {
      if (!item.shortcut) {
        return;
      }

      if (shortcutPressed(item.shortcut, this.pressedKeys)) {
        item.callback();
      }
    };

    shorcuts.forEach(check);
    cmmds.forEach(check);
  }

  public keyup(e: KeyboardEvent) {
    this.pressedKeys.delete(e.which);
  }

  public dispose() {
    window.removeEventListener('keydown', this.boundKeydown);
    window.removeEventListener('keyup', this.boundKeyup);
  }
}

const cmmds: Command[] = [];
const shorcuts: Shortcut[] = [];

const pushAndReturnDispose = (items: Shortcut[], item: Shortcut) => {
  items.push(item);

  return {
    dispose() {
      const i = items.indexOf(item);
      if (i < 0) {
        return;
      }

      // Remove command from the list
      items.splice(i, 1);
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
