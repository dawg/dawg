import { platform } from '@/base/platform';
import { manager } from '@/base/manager';
import { palette } from '@/dawg/extensions/core/palette';
import { menubar } from '@/dawg/extensions/core/menubar';
import { DawgCommand } from '@/dawg/commands';
import { Key, hasKey } from '@/base/keyboard';

export type Command = DawgCommand<[]>;

// FIXME(1) move from here into lower layer
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
    // ignore all targets that aren't the body
    // For example, ignore keys typed in an input
    // This won't work
    if (!hasKey(this.pressedKeys, 'CmdOrCtrl') && e.target !== document.body) {
      return;
    }

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
        const paletteItems = items.map((item) => ({
          ...item,
          action: item.shortcut ? item.shortcut.join('+') : undefined,
        }));

        palette.selectFromItems(paletteItems, {
          onDidSelect: (item) => {
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
      clear() {
        // bus.$emit('clear');
      },
    };
  },
});
