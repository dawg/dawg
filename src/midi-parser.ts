import Midi from '@tonejs/midi';
import Tone from 'tone';

export interface INote {
  start: number;
  duration: number;
  velocity: number;
  name: string;
}

export type INotes = INote[];

export const parse = (buffer: ArrayBuffer): INotes => {
  const json = new Midi(buffer);

  // This could cause a bug
  // We just assume there is one tempo for each midi file
  // We don't currently support bpm changes
  // const tempoIndex = 0;
  // const tempos = json.header.tempos;
  const tempo = json.header.tempos[0];
  const bpm = tempo ? tempo.bpm : Tone.Transport.bpm.value;
  const bps = bpm / 60; // beats per second

  // json.header.tempos[0].time

  // let bps: number | null = null;

  const notes: INote[] = [];
  json.tracks.forEach((track) => {
    track.notes.forEach((note) => {
      // if (tempoIndex < tempos.length) {
      //   // const tempo = tempos[tempoIndex];
      //   while (tempos[tempoIndex].time === undefined || note.time > tempos[tempoIndex].time) {

      //   }
      // }

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
