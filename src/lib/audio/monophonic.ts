import { Seconds, Cents, NormalRange, ContextTime, Note } from '@/lib/audio/types';
import { createInstrument } from '@/lib/audio/instrument';
import { context } from '@/lib/audio/online';
import { ConstantSource } from '@/lib/audio/constant-source';
import { parseNote } from '@/lib/audio/util';

interface MonophonicOpts {
  /**
   * The instrument's frequency signal.
   */
  frequency: ConstantSource;

  /**
   * The instrument's frequency signal.
   */
  detune: ConstantSource;

  /**
   * Internal method which starts the envelope attack
   */
  triggerEnvelopeAttack(time: Seconds, velocity: NormalRange): void;

  /**
   * Internal method which starts the envelope release
   */
  triggerEnvelopeRelease(time: Seconds): void;

  /**
   * Get the level of the output at the given time. Measures
   * the envelope(s) value at the time.
   * @param time The time to query the envelope value
   * @return The output level between 0-1
   */
  getLevelAtTime(time: ContextTime): NormalRange;
}

export interface MonophonicOptions {
  portamento: Seconds;
  // TODO use detune??
  detune: Cents;
}

export const createMonophonic = (opts: MonophonicOpts, options?: Partial<MonophonicOptions>) => {
  const { triggerEnvelopeAttack, triggerEnvelopeRelease, frequency, getLevelAtTime } = opts;
  const portamento = options?.portamento ?? 0;

  const setNote = (note: Note, time: ContextTime) => {
    const hertz = parseNote(note);
    if (portamento > 0 && getLevelAtTime(time) > 0.05) {
      frequency.output.exponentialRampTo(hertz, portamento, time);
    } else {
      frequency.output.setValueAtTime(hertz, time);
    }
  };

  const instrument = createInstrument({
    triggerAttack: (note, time, velocity) => {
      const seconds = time ?? context.now();
      triggerEnvelopeAttack(seconds, velocity ?? 1);
      setNote(note, seconds);
    },
    triggerRelease: (time) => {
      const seconds = time ?? context.now();
      triggerEnvelopeRelease(seconds);
    },
  });

  return instrument;
};

