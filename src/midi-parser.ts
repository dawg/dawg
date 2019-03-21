import Midi from '@tonejs/midi';

export interface INote {
  start: number;
  duration: number;
  velocity: number;
  name: string;
}

export const parse = (buffer: ArrayBuffer) => {
  const json = new Midi(buffer);

  // This could cause a bug
  // We just assume there is one tempo for each midi file
  // We don't currently support bpm changes
  const tempo = json.header.tempos[0];
  const bpm = tempo ? tempo.bpm : 120;
  const bps = bpm / 60; // beats per second

  const notes: INote[] = [];
  json.tracks.forEach((track) => {
    track.notes.forEach((note) => {
      notes.push({
        name: note.name,
        start: note.time / bps,
        duration: note.duration / bps,
        velocity: note.velocity,
      });
    });
  });

  return notes;
};
