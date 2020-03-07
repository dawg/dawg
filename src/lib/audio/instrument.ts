import { Note, ContextTime, Seconds, NormalRange } from '@/lib/audio/types';
import { Context } from '@/lib/audio/context';

interface InstrumentOptions {
  triggerAttack(note: Note, time?: ContextTime, velocity?: NormalRange): void;
  triggerRelease(time?: ContextTime): void;
}

export const createInstrument = ({ triggerAttack, triggerRelease }: InstrumentOptions) => {
  const triggerAttackRelease = (note: Note, duration: Seconds, time?: ContextTime, velocity?: NormalRange) => {
    time = time ?? Context.now();
    triggerAttack(note, time, velocity);
    triggerRelease(time + duration);
  };

  return {
    triggerAttackRelease,
    triggerAttack,
    triggerRelease,
  };
};
