import { Note, ContextTime, Hertz, MidiNote, Seconds, NormalRange, GainFactor, Decibels } from '@/lib/audio/types';
import { getContext } from '@/lib/audio/global';

/**
 * Convert gain to decibels.
 */
export function gainToDb(gain: GainFactor): Decibels {
  return 20 * Math.log10(gain);
}

/**
 * Convert decibels into gain.
 */
export function dbToGain(db: Decibels): GainFactor {
  return Math.pow(10, db / 20);
}

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

export interface ObeoTrigger {
  triggerAttackRelease(
    note: Note | Hertz,
    duration: Seconds,
    time?: ContextTime,
    velocity?: NormalRange,
  ): void;
  triggerAttack(note: Note | Hertz, time?: ContextTime, velocity?: NormalRange): ObeoReleaser;
}

export interface ObeoReleaser {
  triggerRelease(time?: ContextTime): void;
}

export interface InstrumentOptions {
  triggerAttack(note: Note | Hertz, time?: ContextTime, velocity?: NormalRange): ObeoReleaser;
}

export const createTrigger = ({ triggerAttack }: InstrumentOptions) => {
  const context = getContext();
  const triggerAttackRelease = (
    note: Note,
    duration: Seconds,
    time?: ContextTime,
    velocity?: NormalRange,
  ) => {
    time = time ?? context.now();
    const releaser = triggerAttack(note, time, velocity);
    releaser.triggerRelease(time + duration);
  };

  return {
    triggerAttackRelease,
    triggerAttack,
  };
};

import { Midi } from '@tonejs/midi';

export function base64Decode(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

export interface INote {
  start: number;
  duration: number;
  velocity: number;
  name: string;
}

export type INotes = INote[];

export const parseMidi = (buffer: ArrayBuffer, bpm: number): INotes => {
  const json = new Midi(buffer);
  const bps = bpm / 60;

  const notes: INote[] = [];
  json.tracks.forEach((track) => {
    track.notes.forEach((note) => {
      notes.push({
        name: note.name,
        start: note.time * bps,
        duration: note.duration * bps,
        velocity: note.velocity,
      });
    });
  });

  return notes;
};


interface RequestError {
  type: 'error';
  message: string;
}

interface RequestSuccess {
  type: 'success';
  body: string;
}


export async function sendRequest(url: string): Promise<RequestError | RequestSuccess> {
  let response;
  try {
    response = await fetch(url);
  } catch (e) {
    return {
      type: 'error',
      message: e.message,
    };
  }

  return {
    type: 'success',
    body: await response.text(),
  };
}

/*
* Get playback rate for a given pitch change (in cents)
* Basic [math](http://www.birdsoft.demon.co.uk/music/samplert.htm):
* f2 = f1 * 2^( C / 1200 )
*/
export function centsToRate(cents?: number) {
  return cents ? Math.pow(2, cents / 1200) : 1;
}
