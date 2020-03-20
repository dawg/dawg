import { enhanceBaseContext, ObeoBaseContext } from '@/lib/audio/context';
import { onDidTick } from '@/lib/audio/ticker';

export type ObeoContext = ObeoBaseContext<AudioContext>;

export const context: ObeoContext = enhanceBaseContext(new AudioContext(), onDidTick);
