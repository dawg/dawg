import { createEnvelope, Envelope, ObeoEnvelopeOptions } from '@/lib/audio/envelope';
import { createGain } from '@/lib/audio/gain';
import { ObeoNode } from '@/lib/audio/node';

export interface ObeoAmplitudeEnvelope extends Envelope, ObeoNode {}

export type ObeoAmplitudeEnvelopeOptions = ObeoEnvelopeOptions;

export const createAmplitudeEnvelope = (
  options?: Partial<ObeoAmplitudeEnvelopeOptions>,
): ObeoAmplitudeEnvelope => {
  const envelope = createEnvelope(options);

  // Be must init to 0 because the signal is additive
  const gain = createGain({ gain: 0 });
  envelope.connect(gain.gain);

  return {
    ...envelope,
    // The gain will override the audio node functions (ie. connect, disconnect)
    ...gain,
  };
};
