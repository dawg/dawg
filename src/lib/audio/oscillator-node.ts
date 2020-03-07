import { context } from '@/lib/audio/context';
import { createParam } from '@/lib/audio/param';
import { Cents, Hertz } from '@/lib/audio/types';

export interface OscillatorNodeOptions {
  frequency: Hertz;
  detune: Cents;
  type: OscillatorType;
  onEnded: () => AudioScheduledSourceNode['onended'];
}

export const createOscillatorNode = (options?: Partial<OscillatorNodeOptions>) => {
  const oscillator = context.createOscillator();
  oscillator.type = options?.type ?? 'sine';
  if (options?.onEnded) {
    oscillator.onended = options.onEnded;
  }

  const frequency = oscillator.frequency;
  const detune = oscillator.detune;

  return Object.assign({
    frequency: createParam(frequency, { value: options?.frequency ?? 440 }),
    detune: createParam(detune, { value: options?.detune ?? 0 }),
  }, oscillator);
};

export type OscillatorNode = ReturnType<typeof createOscillatorNode>;
