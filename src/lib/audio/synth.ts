import { MonophonicOptions, createMonophonic, ObeoMonophonic } from '@/lib/audio/monophonic';
import { createOscillator, ObeoOscillator, ObeoOscillatorOptions } from '@/lib/audio/oscillator';
import { createVolume } from '@/lib/audio/volume';
import { getLogger } from '@/lib/log';
import { Setter, setter } from '@/lib/reactor';
import { ObeoInstrument } from '@/lib/audio/instrument';
import { createAmplitudeEnvelope, ObeoAmplitudeEnvelope, ObeoAmplitudeEnvelopeOptions } from '@/lib/audio/amplitude-envelope';

const logger = getLogger('synth');

export interface ObeoSynthOptions extends MonophonicOptions {
  oscillator: Partial<ObeoOscillatorOptions>;
  envelope: Partial<ObeoAmplitudeEnvelopeOptions>;
  volume: number;
}

export interface SynthParameters {
  type: Setter<OscillatorType>;
}

export type ObeoSynth = ObeoInstrument & ObeoMonophonic & SynthParameters & {
  oscillator: ObeoOscillator;
  envelope: ObeoAmplitudeEnvelope;
};

export const createSynth = (options?: Partial<ObeoSynthOptions>): ObeoSynth => {
  const oscillator = createOscillator(options?.oscillator);

  const envelope = createAmplitudeEnvelope(options?.envelope);
  const volume = createVolume({ volume: options?.volume });

  oscillator.connect(envelope);
  envelope.connect(volume);

  const monophonic = createMonophonic({
    getLevelAtTime: (time) => {
      logger.debug('getLevelAtTime', time);
      return envelope.getValueAtTime(time);
    },
    frequency: oscillator.frequency,
    detune: oscillator.detune,
    triggerEnvelopeAttack: (time, velocity) => {
      logger.debug('triggerEnvelopeAttack', time, velocity);
      // the envelopes
      envelope.triggerAttack(time, velocity);
      const stopper = oscillator.start(time);
      // if there is no release portion, stop the oscillator
      if (envelope.sustain.value === 0) {
        const computedAttack = envelope.attack;
        const computedDecay = envelope.decay;
        stopper.stop(time + computedAttack.value + computedDecay.value);
      }

      return {
        triggerEnvelopeRelease: (when) => {
          logger.debug('triggerEnvelopeRelease', when);
          envelope.triggerRelease(when);
          stopper.stop(when + envelope.release.value);
        },
      };
    },
  }, options);

  return {
    ...volume,
    ...monophonic,
    oscillator,
    envelope,
    type: setter(() => {
      return oscillator.type;
    }, (value) => {
      oscillator.type = value;
    }),
  };
};
