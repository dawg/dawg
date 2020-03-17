import { enhanceBaseContext, ObeoBaseContext } from '@/lib/audio/context';

export type ObeoContext = ObeoBaseContext;

export const context = enhanceBaseContext(new AudioContext());
