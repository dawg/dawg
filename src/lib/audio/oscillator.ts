import { augmentSource, SourceOptions } from '@/lib/audio/source';
import { createConstantSource } from '@/lib/audio/constant-source';
import { Cents, Hertz } from '@/lib/audio/types';
import { context } from '@/lib/audio/online';
import { createParam } from '@/lib/audio/param';

export interface OscillatorOptions extends SourceOptions {
  type: OscillatorType;
  frequency: Hertz;
  detune: Cents;
}

export const createOscillator = (options?: Partial<OscillatorOptions>) => {
  const oscillator = augmentSource(context.createOscillator(), options);
  oscillator.type = options?.type ?? 'sine';

  const frequencyParam = createParam(oscillator.frequency, { value: options?.frequency ?? 440 });
  const detuneParam = createParam(oscillator.detune, { value: options?.detune ?? 0 });

  // TODO initial values ??
  const frequency = createConstantSource();
  frequency.connect(frequencyParam);

  const detune = createConstantSource();
  detune.connect(detuneParam);

  return Object.assign(oscillator, { sources: { frequency, detune } });
};
