export function midiToFreq(midi: number, tuning?: number) {
  return Math.pow(2, (midi - 69) / 12) * (tuning ?? 440);
}

/**
 * A regex for matching note strings in scientific notation.
 *
 * @name regex
 * @function
 * @return {RegExp} the regexp used to parse the note name
 *
 * The note string should have the form `letter[accidentals][octave][element]`
 * where:
 *
 * - letter: (Required) is a letter from A to G either upper or lower case
 * - accidentals: (Optional) can be one or more `b` (flats), `#` (sharps) or `x` (double sharps).
 * They can NOT be mixed.
 * - octave: (Optional) a positive or negative integer
 * - element: (Optional) additionally anything after the duration is considered to
 * be the element name (for example: 'C2 dorian')
 *
 * The executed regex contains (by array index):
 *
 * - 0: the complete string
 * - 1: the note letter
 * - 2: the optional accidentals
 * - 3: the optional octave
 * - 4: the rest of the string (trimmed)
 *
 * @example
 * var parser = require('note-parser')
 * parser.regex.exec('c#4')
 * // => ['c#4', 'c', '#', '4', '']
 * parser.regex.exec('c#4 major')
 * // => ['c#4major', 'c', '#', '4', 'major']
 * parser.regex().exec('CMaj7')
 * // => ['CMaj7', 'C', '', '', 'Maj7']
 */
const REGEX = /^([a-gA-G])(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)\s*$/;

const SEMITONES = [0, 2, 4, 5, 7, 9, 11];
/**
 * Parse a note name in scientific notation an return it's components,
 * and some numeric properties including midi number and frequency.
 *
 * @name parse
 * @function
 * @param note - the note string to be parsed
 * @param isTonic - true the strings it's supposed to contain a note number
 * and some category (for example an scale: 'C# major'). It's false by default,
 * but when true, en extra tonicOf property is returned with the category ('major')
 * @param tunning - The frequency of A4 note to calculate frequencies.
 * By default it 440.
 * @return the parsed note name or null if not a valid note
 *
 * The parsed note name object will ALWAYS contains:
 * - letter: the uppercase letter of the note
 * - acc: the accidentals of the note (only sharps or flats)
 * - pc: the pitch class (letter + acc)
 * - step: s a numeric representation of the letter. It's an integer from 0 to 6
 * where 0 = C, 1 = D ... 6 = B
 * - alt: a numeric representation of the accidentals. 0 means no alteration,
 * positive numbers are for sharps and negative for flats
 * - chroma: a numeric representation of the pitch class. It's like midi for
 * pitch classes. 0 = C, 1 = C#, 2 = D ... 11 = B. Can be used to find enharmonics
 * since, for example, chroma of 'Cb' and 'B' are both 11
 *
 * If the note has octave, the parser object will contain:
 * - oct: the octave number (as integer)
 * - midi: the midi number
 * - freq: the frequency (using tuning parameter as base)
 *
 * If the parameter `isTonic` is set to true, the parsed object will contain:
 * - tonicOf: the rest of the string that follows note name (left and right trimmed)
 *
 * @example
 * var parse = require('note-parser').parse
 * parse('Cb4')
 * // => { letter: 'C', acc: 'b', pc: 'Cb', step: 0, alt: -1, chroma: -1,
 *         oct: 4, midi: 59, freq: 246.94165062806206 }
 * // if no octave, no midi, no freq
 * parse('fx')
 * // => { letter: 'F', acc: '##', pc: 'F##', step: 3, alt: 2, chroma: 7 })
 */
export function parse(str: string, isTonic?: boolean, tuning?: number) {
  const m = REGEX.exec(str);
  if (!m || (!isTonic && m[4])) {
    return null;
  }

  const acc = m[2].replace(/x/g, '##');
  const letter = m[1].toUpperCase();
  const pc = letter + acc;
  const step = (letter.charCodeAt(0) + 3) % 7;
  const alt = acc[0] === 'b' ? -acc.length : acc.length;
  const pos = SEMITONES[step] + alt;
  const chroma = pos < 0 ? 12 + pos : pos % 12;

  let oct: number | undefined;
  let midi: number | undefined;
  let freq: number | undefined;
  if (m[3]) { // has octave
    oct = +m[3];
    midi = pos + 12 * (oct + 1);
    freq = midiToFreq(midi, tuning);
  }

  let tonicOf: string | undefined;
  if (isTonic) {
    tonicOf = m[4];
  }

  return {
    acc,
    letter,
    pc,
    step,
    alt,
    pos,
    chroma,
    oct,
    midi,
    freq,
    tonicOf,
  };
}

/**
 * Get midi of a note
 *
 * @name midi
 * @function
 * @param {String|Integer} note - the note name or midi number
 * @return {Integer} the midi number of the note or null if not a valid note
 * or the note does NOT contains octave
 * @example
 * var parser = require('note-parser')
 * parser.midi('A4') // => 69
 * parser.midi('A') // => null
 * @example
 * // midi numbers are bypassed (even as strings)
 * parser.midi(60) // => 60
 * parser.midi('60') // => 60
 */
export function parseNote(note: string | number) {
  if (
    (typeof note === 'number' || typeof note === 'string') &&
    note >= 0 && note < 128
  ) {
    return +note;
  }

  if (typeof note === 'number') {
    return;
  }

  return parse(note)?.midi;
}
