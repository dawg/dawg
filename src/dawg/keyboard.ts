import * as platform from '@/dawg/platform';

export type Key =
  'Shift' |
  'CmdOrCtrl' |
  'Ctrl' |
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


type CommandCallback = () => void;

export type KeyCode = number | { [p in platform.Platform]: number };
export type KeyCodeLookup = { [k in Key]: KeyCode };

export const codeLookup: KeyCodeLookup = {
  Shift: 16,
  CmdOrCtrl: {
    [platform.Platform.Windows]: 17,
    [platform.Platform.Mac]: 91,
    [platform.Platform.Linux]: 17,
  }, // 55 is the Mac command key
  Ctrl: 17,
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
