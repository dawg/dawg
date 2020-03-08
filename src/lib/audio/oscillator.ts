import { SourceOptions } from '@/lib/audio/source';
import { createConstantSource, ObeoConstantSourceNode } from '@/lib/audio/constant-source';
import { Cents, Hertz, ContextTime } from '@/lib/audio/types';
import { context } from '@/lib/audio/online';
import { createParam } from '@/lib/audio/param';
import { createVolume } from '@/lib/audio/volume';
import { reverse } from '@/lib/std';
import { ObeoScheduledSourceNode } from '@/lib/audio/scheduled-source-node';

export interface OscillatorOptions extends SourceOptions {
  type: OscillatorType;
  frequency: Hertz;
  detune: Cents;
}

export interface ObeoOscillator extends ObeoScheduledSourceNode<AudioNode> {
  // OscillatorNode
  readonly detune: ObeoConstantSourceNode;
  readonly frequency: ObeoConstantSourceNode;
  type: OscillatorType;
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
  const frequency = createConstantSource({ name: 'Frequency' });
  const detune = createConstantSource({ name: 'Detune' });

  let wave: PeriodicWave | undefined;

  let saved: OscillatorNode | undefined;
  const start = (when?: ContextTime) => {
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

    const detuneParam = createParam(internal.detune, { value: options?.detune ?? 0, name: 'Detune' });
    detune.connect(detuneParam);

    internal.start(when ?? context.now());
  };

  const stop = (when?: ContextTime) => {
    if (saved) {
      saved.stop(when ?? context.now());
    }
  };

  // TODO properties
  const oscillator: ObeoOscillator = {
    ...volume,

    // OscillatorNode
    detune,
    frequency,
    type: options?.type ?? 'sine',
    start,
    stop,
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
