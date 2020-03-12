import { Note, Hertz, MidiNote } from '@/lib/audio/types';

/**
 * Assert that the statement is true, otherwise invoke the error.
 * @param statement
 * @param error The message which is passed into an Error
 */
export function assert(statement: boolean, error: string): void {
  if (!statement) {
    throw new Error(error);
  }
}

/**
 * The Global [concert tuning pitch](https://en.wikipedia.org/wiki/Concert_pitch) which is used
 * to generate all the other pitch values from notes. A4's values in Hertz.
 */
export const A4: Hertz = 440;

/**
 * Convert a MIDI note to frequency value.
 * @param  midi The midi number to convert.
 * @return The corresponding frequency value
 * @example
 * import { mtof } from "tone";
 * mtof(69); // 440
 */
export function mtof(midi: MidiNote): Hertz {
  return A4 * Math.pow(2, (midi - 69) / 12);
}

const REGEX = /^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i;

const noteToScaleIndex = {
  'cbb': -2, 'cb': -1, 'c': 0, 'c#': 1, 'cx': 2,
  'dbb': 0, 'db': 1, 'd': 2, 'd#': 3, 'dx': 4,
  'ebb': 2, 'eb': 3, 'e': 4, 'e#': 5, 'ex': 6,
  'fbb': 3, 'fb': 4, 'f': 5, 'f#': 6, 'fx': 7,
  'gbb': 5, 'gb': 6, 'g': 7, 'g#': 8, 'gx': 9,
  'abb': 7, 'ab': 8, 'a': 9, 'a#': 10, 'ax': 11,
  'bbb': 9, 'bb': 10, 'b': 11, 'b#': 12, 'bx': 13,
};

export const parseNote = (str: Note): Hertz => {
  const m = REGEX.exec(str);
  const [pitch, octave] = [m![1], m![2]];
  const index = noteToScaleIndex[pitch.toLowerCase() as keyof typeof noteToScaleIndex];
  const noteNumber = index + (parseInt(octave, 10) + 1) * 12;
  return mtof(noteNumber as MidiNote);
};
