import { Note, ContextTime, Seconds, NormalRange } from '@/lib/audio/types';
import { context } from '@/lib/audio/online';

interface InstrumentOptions {
  triggerAttack(note: Note, time?: ContextTime, velocity?: NormalRange): void;
  triggerRelease(time?: ContextTime): void;
}

export const createInstrument = ({ triggerAttack, triggerRelease }: InstrumentOptions) => {
  const triggerAttackRelease = (note: Note, duration: Seconds, time?: ContextTime, velocity?: NormalRange) => {
    time = time ?? context.now();
    triggerAttack(note, time, velocity);
    triggerRelease(time + duration);
  };

  return {
    triggerAttackRelease,
    triggerAttack,
    triggerRelease,
  };
};
