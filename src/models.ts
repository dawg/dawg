import * as t from 'io-ts';

const ValidateNoteProps = {
  // The id of the note. C8 is 0 and 	A0 is 87 (88 notes in total).
  id: t.Integer,
  // The start time of the note in beats.
  time: t.number,
  // The duration of the note in beats.
  duration: t.number,
};
export const ValidateNote = t.type(ValidateNoteProps);
export interface Note extends t.TypeOf<typeof ValidateNote> {}

export const ValidateOscillator = t.type({
  pan: t.number,
  volume: t.number,
});
export interface Oscillator extends t.TypeOf<typeof ValidateOscillator> {}

// export const ValidateFatOscillator = t.type({
//   ...ValidateNoteProps,
//   spread: t.number,
// });
// interface FatOscillator extends t.TypeOf<typeof ValidateFatOscillator> {}

export const ValidateEnvelope = t.type({
  attack: t.number,
  decay: t.number,
  sustain: t.number,
  release: t.number,
});
export interface Envelope extends t.TypeOf<typeof ValidateEnvelope> {}

// interface SynthOptions {
//   fatsawtooth: FatOscillator;
//   sawtooth: Oscillator;
//   sine: Oscillator;
//   square: Oscillator;
//   triangle: Oscillator;
// }

const ValidateSynth = t.type({
  type: t.string,
  // options: ValidateOscillator,
  // envelope: ValidateEnvelope,
});
export interface Synth extends t.TypeOf<typeof ValidateSynth> {}


const ValidateInstrument = t.type({
  name: t.string,
  pan: t.number,
  volume: t.number,
  type: t.string,
  // source: ValidateSynth,
});
export interface Instrument extends t.TypeOf<typeof ValidateInstrument> {}

const ValidateScore = t.type({
  name: t.string,
  instrument: t.string,
  notes: t.array(ValidateNote),
});
export interface Score extends t.TypeOf<typeof ValidateScore> {}

export const ValidatePattern = t.type({
  name: t.string,
  scores: t.array(ValidateScore),
});
export interface Pattern extends t.TypeOf<typeof ValidatePattern> {}

export const ValidateProject = t.type({
  bpm: t.number,
  patterns: t.array(ValidatePattern),
  instruments: t.array(ValidateInstrument),
});
export interface Project extends t.TypeOf<typeof ValidateProject> {}
