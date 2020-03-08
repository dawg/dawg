import { MonophonicOptions, createMonophonic } from '@/lib/audio/monophonic';
import { EnvelopeOptions, createEnvelope } from '@/lib/audio/envelope';
import { context } from '@/lib/audio/online';
import { createOscillator, OscillatorOptions } from '@/lib/audio/oscillator';
import { createVolume } from '@/lib/audio/volume';



export interface SynthOptions extends MonophonicOptions {
  oscillator: Partial<OscillatorOptions>;
  envelope: Partial<EnvelopeOptions>;
}

export const createSynth = (options?: Partial<SynthOptions>) => {
  const oscillator = createOscillator(options?.oscillator);

  const frequency = oscillator.sources.frequency;
  const detune = oscillator.sources.detune;

  const envelope = createEnvelope(options?.envelope);
  const volume = createVolume();

  oscillator.connect(envelope);
  envelope.connect(volume);

  const monophonic = createMonophonic({
    getLevelAtTime: (time) => {
      time = time ?? context.now();
      return envelope.getValueAtTime(time);
    },
    frequency,
    detune,
    triggerEnvelopeAttack: (time, velocity) => {
        // the envelopes
      envelope.triggerAttack(time, velocity);
      oscillator.start(time);
      // if there is no release portion, stop the oscillator
      if (envelope.sustain === 0) {
        const computedAttack = envelope.attack;
        const computedDecay = envelope.decay;
        oscillator.stop(time + computedAttack + computedDecay);
      }
    },
    triggerEnvelopeRelease: (time) => {
      envelope.triggerRelease(time);
      oscillator.stop(time + envelope.release);
    },
  }, options);

  // TODO generalize to helper function maybe to extract core AudioNode attributes ??
  return Object.assign({
    connect: volume.connect.bind(volume),
    frequency,
    detune,
  }, monophonic);
};
