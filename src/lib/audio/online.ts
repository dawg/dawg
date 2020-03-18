import { enhanceBaseContext, ObeoBaseContext } from '@/lib/audio/context';
import { onDidTick } from '@/lib/audio/ticker';

export type ObeoContext = ObeoBaseContext;

export const context: ObeoContext = enhanceBaseContext(new AudioContext(), onDidTick);
