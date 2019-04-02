import Midi from '@tonejs/midi';
import Tone from 'tone';

export interface INote {
  start: number;
  duration: number;
  velocity: number;
  name: string;
}

export type INotes = INote[];

export const parse = (buffer: ArrayBuffer, bpm: number): INotes => {
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

export default {
  parse,
};
