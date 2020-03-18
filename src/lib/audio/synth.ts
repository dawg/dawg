import { MonophonicOptions, createMonophonic, ObeoMonophonic } from '@/lib/audio/monophonic';
import { EnvelopeOptions, createEnvelope } from '@/lib/audio/envelope';
import { createOscillator, OscillatorOptions } from '@/lib/audio/oscillator';
import { createVolume, ObeoVolumeNode } from '@/lib/audio/volume';
import { getLogger } from '@/lib/log';
import { Setter, setter } from '@/lib/reactor';
import { ObeoInstrument } from '@/lib/audio/instrument';

const logger = getLogger('synth');

export interface SynthOptions extends MonophonicOptions {
  oscillator: Partial<OscillatorOptions>;
  envelope: Partial<EnvelopeOptions>;
}

export interface ObeoSynth extends ObeoInstrument {
  type: Setter<OscillatorType>;
}

export const createSynth = (options?: Partial<SynthOptions>): ObeoSynth => {
  const oscillator = createOscillator(options?.oscillator);

  const envelope = createEnvelope(options?.envelope);
  const volume = createVolume();

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
      if (envelope.sustain === 0) {
        const computedAttack = envelope.attack;
        const computedDecay = envelope.decay;
        stopper.stop(time + computedAttack + computedDecay);
      }

      return {
        triggerEnvelopeRelease: (when) => {
          logger.debug('triggerEnvelopeRelease', when);
          envelope.triggerRelease(when);
          stopper.stop(when + envelope.release);
        },
      };
    },
  }, options);

  // TODO generalize to helper function maybe to extract core AudioNode attributes ??
  return {
    ...volume,
    ...monophonic,
    // connect: volume.connect.bind(volume),
    // disconnect: volume.disconnect.bind(volume),
    frequency: oscillator.frequency,
    detune: oscillator.detune,
    type: setter(() => {
      return oscillator.type;
    }, (value) => {
      oscillator.type = value;
    }),
  };
};
