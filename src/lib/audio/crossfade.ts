import { createSignal, ObeoSignal } from '@/lib/audio/signal';
import { createWaveShaper } from '@/lib/audio/wave-shaper';
import { createStereoPanner } from '@/lib/audio/stereo-panner';
import { ObeoNode, mimicAudioNode } from '@/lib/audio/node';
import { createGain, ObeoGain } from '@/lib/audio/gain';
import { createChannelSplitter } from '@/lib/audio/channel-splitter';

export interface ObeoCrossfade extends ObeoNode {
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

  // Fade (Signal) -> G2A ([0, 1] to [-1, 1]) -> Panner (Param)
  // Panner [2] -> Splitter -> A (Gain)
  //                        -> B (Gain)

  const fade = createSignal();

  const g2a = createWaveShaper({ mapping: (x) => Math.abs(x) * 2 - 1 });
  fade.connect(g2a);

  const panner = createStereoPanner();
  g2a.connect(panner.pan);

  const one = createSignal({ value: 1 });
  one.connect(panner);

  // const temp = createSignal();
  // temp.connect(panner);

  const splitter = createChannelSplitter(2);
  panner.connect(splitter);

  splitter.connect(a.gain, 0);
  splitter.connect(b.gain, 1);

  const output = createGain();
  a.connect(output);
  b.connect(output);

  // TODO you shouldn't be able to connect to this
  return {
    ...mimicAudioNode(output.input, output.output),
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
