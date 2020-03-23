import { createEnvelope, ObeoEnvelope, ObeoEnvelopeOptions } from '@/lib/audio/envelope';
import { createGain } from '@/lib/audio/gain';

export type ObeoAmplitudeEnvelope = ObeoEnvelope;

export type ObeoAmplitudeEnvelopeOptions = ObeoEnvelopeOptions;

export const createAmplitudeEnvelope = (options?: Partial<ObeoAmplitudeEnvelopeOptions>) => {
  const envelope = createEnvelope(options);

  // Be must init to 0 because the signal is additive
  const gain = createGain({ value: 0 });
  envelope.connect(gain.gain);

  return {
    ...envelope,
    // The gain will override the audio node functions (ie. connect, disconnect)
    ...gain,
  };
};
