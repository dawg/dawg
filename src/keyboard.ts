import * as platform from '@/platform';

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

export type KeyCode = number | { [p in platform.Platform]: number };
