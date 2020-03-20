import { SourceOptions } from '@/lib/audio/source';
import { Cents, Hertz, ContextTime } from '@/lib/audio/types';
import { createParam, ObeoParam } from '@/lib/audio/param';
import { createVolume } from '@/lib/audio/volume';
import { ObeoScheduledSourceNode, Stopper } from '@/lib/audio/scheduled-source-node';
import { createSignal, ObeoSignalNode } from '@/lib/audio/signal';
import { getContext } from '@/lib/audio/global';

export interface OscillatorOptions extends SourceOptions {
  type: OscillatorType;
  frequency: Hertz;
  detune: Cents;
  onended: () => void;
}

export interface ObeoOscillator extends ObeoScheduledSourceNode<AudioNode> {
  // OscillatorNode
  readonly detune: ObeoSignalNode;
  readonly frequency: ObeoSignalNode;
  type: OscillatorType;
  volume: ObeoParam;
  setPeriodicWave(periodicWave: PeriodicWave): void;
}

export const createOscillator = (options?: Partial<OscillatorOptions>): ObeoOscillator => {
  const context = getContext();
  const volume = createVolume();

  // TODO initial values ??
  const frequency = createSignal({ name: 'Frequency' });
  const detune = createSignal({ name: 'Detune' });

  let wave: PeriodicWave | undefined;

  const start = (when?: ContextTime): Stopper => {
    const internal = context.createOscillator();
    internal.type = oscillator.type;
    internal.connect(volume.input);

    internal.onended = options?.onended ?? null;

    if (wave) {
      internal.setPeriodicWave(wave);
    }

    const frequencyParam = createParam(
      internal.frequency,
      { value: options?.frequency ?? 440, name: 'Frequency' },
    );

    frequency.connect(frequencyParam);
    frequencyParam.value = frequency.offset.value;

    const detuneParam = createParam(
      internal.detune,
      { value: options?.detune ?? 0, name: 'Detune' },
    );

    detune.connect(detuneParam);
    detuneParam.value = detune.offset.value;

    internal.start(when ?? context.now());

    return {
      stop: (whenToStop?: ContextTime) => {
        internal.stop(whenToStop ?? context.now());
      },
    };
  };


  // TODO properties
  const oscillator: ObeoOscillator = {
    // TODO this is kinda messed up?? Is it??
    ...volume,

    // OscillatorNode
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
