import { ObeoNode, mimicAudioNode } from '@/lib/audio/node';
import { ObeoSignal } from '@/lib/audio/signal';
import { createCrossfade } from '@/lib/audio/crossfade';
import { createGain } from '@/lib/audio/gain';

export interface ObeoEffect extends ObeoNode {
  wet: ObeoSignal;
}

export const createEffect = (node: ObeoNode): ObeoEffect => {
  const crossfade = createCrossfade();
  const input = createGain();

  input.connect(crossfade.a);
  input.connect(node);
  node.connect(crossfade.b);

  return {
    ...mimicAudioNode(input.input, crossfade.output),
    wet: crossfade.fade,
  };
};
