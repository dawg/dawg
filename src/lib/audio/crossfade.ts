import { createSignal, ObeoSignal } from '@/lib/audio/signal';
import { createWaveShaper } from '@/lib/audio/wave-shaper';
import { createStereoPanner } from '@/lib/audio/stereo-panner';
import { ObeoNode } from '@/lib/audio/node';
import { createGain, ObeoGain } from '@/lib/audio/gain';
import { createChannelSplitter } from '@/lib/audio/channel-splitter';
import { Disposer } from '@/lib/std';

export interface ObeoCrossfade extends ObeoNode, Disposer {
  /**
   * The input which is at full level when fade = 0
   */
  readonly a: ObeoGain;

  /**
   * The input which is at full level when fade = 1
   */
  readonly b: ObeoGain;

  /**
   * The fade signal.
   */
  readonly fade: ObeoSignal;
}

// TODO test

export const createCrossfade = (): ObeoCrossfade => {
  const a = createGain({ value: 0 });
  const b = createGain({ value: 0 });

  const fade = createSignal();

  const g2a = createWaveShaper({ mapping: (x) => Math.abs(x) * 2 - 1 });
  fade.connect(g2a);

  const panner = createStereoPanner();
  g2a.connect(panner.pan);

  const splitter = createChannelSplitter(2);
  splitter.connect(a.gain, 0);
  splitter.connect(b.gain, 1);

  const output = createGain();
  a.connect(output);
  b.connect(output);

  return {
    ...output,
    a,
    b,
    fade,
    dispose() {
      output.dispose();
      splitter.dispose();
      panner.dispose();
      g2a.dispose();
      fade.dispose();
      a.dispose();
      b.dispose();
    },
  };
};
