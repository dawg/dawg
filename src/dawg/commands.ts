import * as keyboard from '@/base/keyboard';

// TODO remove
export interface DawgCommand<T extends any[]> {
  text: string;
  shortcut?: keyboard.Key[];
  callback: (...args: T) => void;
}
