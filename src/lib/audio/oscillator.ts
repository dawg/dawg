import { createSource } from '@/lib/audio/source';
import { createConstantSource } from '@/lib/audio/constant-source';
import { Cents, Hertz, ContextTime } from '@/lib/audio/types';
import { Context } from '@/lib/audio/context';
import { OscillatorNode, createOscillatorNode } from '@/lib/audio/oscillator-node';

export interface OscillatorOptions {
  type: OscillatorType;
  frequency: Hertz;
  detune: Cents;
  // TODO
  // partialCount: number;
  // partials: number[];
  // phase: number;
}

export const createOscillator = (options?: Partial<OscillatorOptions>) => {
  const type = options?.type ?? 'sine';
  let oscillator: OscillatorNode | undefined;

  const frequency = createConstantSource({
    value: options?.frequency ?? 440,
  });

  const detune = createConstantSource({
    value: options?.detune ?? 0,
  });

  /**
   * start the oscillator
   */
  const start = (time?: ContextTime) => {
    const computedTime = time ?? Context.now();
    oscillator = createOscillatorNode();
    oscillator.type = type;

    // connect the control signal to the oscillator frequency & detune
    oscillator.connect(source);
    frequency.connect(oscillator.frequency);
    detune.connect(oscillator.detune);

    // start the oscillator
    oscillator.start(computedTime);
  };

  /**
   * stop the oscillator
   */
  const stop = (time?: ContextTime) => {
    const computedTime = time ?? Context.now();
    if (oscillator) {
      oscillator.stop(computedTime);
    }
  };

  const source = createSource({
    start,
    stop,
    restart: () => {
      //
    },
    // TODO the next three things
    volume: 1,
    mute: false,
    onStop: () => {
      //
    },
  });

  return Object.assign({ frequency, detune }, source);
};
