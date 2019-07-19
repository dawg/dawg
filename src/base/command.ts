import * as keyboard from '@/base/keyboard';

export interface Command<T extends any[]> {
  text: string;
  shortcut?: keyboard.Key[];
  callback: (...args: T) => void;
}
