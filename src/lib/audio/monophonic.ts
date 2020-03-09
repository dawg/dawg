import { Seconds, Cents, NormalRange, ContextTime, Note } from '@/lib/audio/types';
import { createInstrument, ObeoInstrument } from '@/lib/audio/instrument';
import { context } from '@/lib/audio/online';
import { parseNote } from '@/lib/audio/util';
import { ObeoSignalNode } from '@/lib/audio/signal';

export interface EnvelopeReleaser {
  /**
   * Internal method which starts the envelope release.
   */
  triggerEnvelopeRelease(time: Seconds): void;
}

export interface ObeoMonophonic extends ObeoInstrument {
  frequency: ObeoSignalNode;
  detune: ObeoSignalNode;
  portamento: number;
}

export interface MonophonicParams {
  /**
   * The instrument's frequency signal.
   */
  frequency: ObeoSignalNode;

  /**
   * The instrument's frequency signal.
   */
  detune: ObeoSignalNode;

  /**
   * Internal method which starts the envelope attack.
   */
  triggerEnvelopeAttack(time: Seconds, velocity: NormalRange): EnvelopeReleaser;

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
  detune: Cents;
}

/**
 * Create a monophonic instrument. "Monophonic" is defined as "having a single unaccompanied
 * melodic line".
 *
 * @param params The parameters.
 * @param options The options.
 */
export const createMonophonic = (
  params: MonophonicParams,
  options?: Partial<MonophonicOptions>,
): ObeoMonophonic => {

  const setNote = (note: Note, time: ContextTime) => {
    const hertz = parseNote(note);
    if (monophonic.portamento > 0 && params.getLevelAtTime(time) > 0.05) {
      params.frequency.offset.exponentialRampTo(hertz, monophonic.portamento, time);
    } else {
      params.frequency.offset.setValueAtTime(hertz, time);
    }
  };

  const instrument = createInstrument({
    triggerAttack: (note, time, velocity) => {
      const seconds = time ?? context.now();
      setNote(note, seconds);
      const releaser = params.triggerEnvelopeAttack(seconds, velocity ?? 1);

      return {
        triggerRelease: (when) => {
          releaser.triggerEnvelopeRelease(when ?? context.now());
        },
      };
    },
  });

  if (options?.detune !== undefined) {
    params.detune.offset.value = options.detune;
  }

  const monophonic: ObeoMonophonic = {
    ...instrument,
    portamento: options?.portamento ?? 0,
    frequency: params.frequency,
    detune: params.detune,
  };

  return monophonic;
};

