import {
  ObeoConstantSource,
  ObeoConstantSourceOptions,
  createConstantSource,
} from '@/lib/audio/constant-source';
import { ObeoNode } from '@/lib/audio/node';
import { ObeoParam } from '@/lib/audio/param';

export type ObeoSignal = ObeoConstantSource;

export type ObeoSignalOptions = ObeoConstantSourceOptions;

export const createSignal = (options?: Partial<ObeoSignalOptions>): ObeoSignal => {
  const source = createConstantSource(options);
  source.start(0);
  return {
    ...source,
    connect: (destinationNode: ObeoNode | ObeoParam, output?: number, input?: number) => {
      if (destinationNode.name === 'node') {
        source.connect(destinationNode, output, input);
      } else {
        // When we connect a signal to a param, we want that signal to have complete control over that parameter
        // With the Web Audio API, this connection would be additive.
        // So, here we cancel everything that's already been scheduled and reset the value to 0 at time 0
        // This may cause unexpected behaviors so beware
        destinationNode.cancelScheduledValues(0);
        destinationNode.setValueAtTime(0, 0);

        source.connect(destinationNode, output);
      }
    },
  };
};
