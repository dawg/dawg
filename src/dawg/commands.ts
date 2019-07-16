import * as keyboard from '@/dawg/keyboard';

export interface DawgCommand<T extends any[]> {
  text: string;
  shortcut?: keyboard.Key[];
  callback: (...args: T) => void;
}
