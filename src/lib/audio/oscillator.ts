import { SourceOptions } from '@/lib/audio/source';
import { Cents, Hertz, ContextTime } from '@/lib/audio/types';
import { context } from '@/lib/audio/online';
import { createParam, ObeoParam } from '@/lib/audio/param';
import { createVolume } from '@/lib/audio/volume';
import { reverse } from '@/lib/std';
import { ObeoScheduledSourceNode, Stopper } from '@/lib/audio/scheduled-source-node';
import { createSignal, ObeoSignalNode } from '@/lib/audio/signal';

export interface OscillatorOptions extends SourceOptions {
  type: OscillatorType;
  frequency: Hertz;
  detune: Cents;
}

export interface ObeoOscillator extends ObeoScheduledSourceNode<AudioNode> {
  // OscillatorNode
  readonly detune: ObeoSignalNode;
  readonly frequency: ObeoSignalNode;
  type: OscillatorType;
  volume: ObeoParam;
  setPeriodicWave(periodicWave: PeriodicWave): void;
  addEventListener<K extends keyof AudioScheduledSourceNodeEventMap>(
    type: K,
    listener: (this: OscillatorNode, ev: AudioScheduledSourceNodeEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof AudioScheduledSourceNodeEventMap>(
    type: K,
    listener: (this: OscillatorNode, ev: AudioScheduledSourceNodeEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
}

type Listener<K extends keyof AudioScheduledSourceNodeEventMap> =
  (this: OscillatorNode, ev: AudioScheduledSourceNodeEventMap[K]) => any;

type ListenerOptions = boolean | EventListenerOptions;

export const createOscillator = (options?: Partial<OscillatorOptions>): ObeoOscillator => {
  const volume = createVolume();
  const events: { [K in keyof AudioScheduledSourceNodeEventMap]: Array<[Listener<K>, ListenerOptions | undefined]> } = {
    ended: [],
  };

  // TODO initial values ??
  const frequency = createSignal({ name: 'Frequency' });
  const detune = createSignal({ name: 'Detune' });

  let wave: PeriodicWave | undefined;

  let saved: OscillatorNode | undefined;
  const start = (when?: ContextTime): Stopper => {
    const internal = saved = context.createOscillator();
    internal.type = oscillator.type;
    internal.onended = oscillator.onended;
    internal.connect(volume.node);

    // this isn't generalized atm
    for (const [listener, opts] of events.ended) {
      internal.addEventListener('ended', listener, opts);
    }

    const remove = () => {
      for (const [listener, opts] of events.ended) {
        internal.removeEventListener('ended', listener, opts);
      }

      internal.removeEventListener('ended', remove);
    };

    internal.addEventListener('ended', remove);

    if (wave) {
      internal.setPeriodicWave(wave);
    }

    const frequencyParam = createParam(internal.frequency, { value: options?.frequency ?? 440, name: 'Frequency' });
    frequency.connect(frequencyParam);
    frequencyParam.value = frequency.offset.value;

    const detuneParam = createParam(internal.detune, { value: options?.detune ?? 0, name: 'Detune' });
    detune.connect(detuneParam);
    detuneParam.value = detune.offset.value;

    internal.start(when ?? context.now());

    return {
      stop,
    };
  };

  const stop = (when?: ContextTime) => {
    if (saved) {
      saved.stop(when ?? context.now());
    }
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
    onended: () => ({}),
    setPeriodicWave: (value) => {
      wave = value;
    },
    addEventListener: (type, listener, opts) => {
      events[type].push([listener, opts]);
    },
    removeEventListener: (type, listener, _) => {
      let i = events[type].length - 1;
      for (const target of reverse(events[type])) {
        if (target[0] === listener) {
          events[type].splice(i, 1);
        }

        i--;
      }
    },
  };

  return oscillator;
};
