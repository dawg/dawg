import { Cents, Hertz, ContextTime } from '@/lib/audio/types';
import { createParam, ObeoParam } from '@/lib/audio/param';
import { createVolume } from '@/lib/audio/volume';
import { ObeoScheduledSourceNode, ObeoScheduledSourceStopper } from '@/lib/audio/scheduled-source-node';
import { createSignal, ObeoSignal } from '@/lib/audio/signal';
import { getContext } from '@/lib/audio/global';
import { mimicAudioNode } from '@/lib/audio/node';

export interface ObeoOscillatorOptions {
  type: OscillatorType;
  frequency: Hertz;
  detune: Cents;
  onended: () => void;
}

export interface ObeoOscillator extends ObeoScheduledSourceNode<AudioNode> {
  // OscillatorNode
  readonly detune: ObeoSignal;
  readonly frequency: ObeoSignal;
  type: OscillatorType;
  volume: ObeoParam;
  setPeriodicWave(periodicWave: PeriodicWave): void;
}

export const createOscillator = (options?: Partial<ObeoOscillatorOptions>): ObeoOscillator => {
  const context = getContext();
  const volume = createVolume();

  const frequency = createSignal({ name: 'Frequency', value: options?.frequency ?? 440 });
  const detune = createSignal({ name: 'Detune', value: options?.frequency ?? 0 });

  let wave: PeriodicWave | undefined;

  const start = (when?: ContextTime): ObeoScheduledSourceStopper => {
    const internal = context.createOscillator();
    internal.type = oscillator.type;
    internal.connect(volume.input);

    internal.onended = options?.onended ?? null;

    if (wave) {
      internal.setPeriodicWave(wave);
    }

    const frequencyParam = createParam(internal.frequency, { name: 'Frequency' });
    frequency.connect(frequencyParam);

    const detuneParam = createParam(internal.detune, { name: 'Detune' });
    detune.connect(detuneParam);

    internal.start(when ?? context.now());

    return {
      stop: (whenToStop?: ContextTime) => {
        internal.stop(whenToStop ?? context.now());
      },
    };
  };


  const oscillator: ObeoOscillator = {
    ...mimicAudioNode(undefined, volume.output),
    volume: volume.volume,
    detune,
    frequency,
    type: options?.type ?? 'sine',
    start,
    setPeriodicWave: (value) => {
      wave = value;
    },
  };

  return oscillator;
};
