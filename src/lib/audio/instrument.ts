import { ObeoVolumeNode } from '@/lib/audio/volume';
import { ObeoTrigger } from '@/lib/audio/util';

/**
 * An instrument.
 */
export type ObeoInstrument = ObeoTrigger & ObeoVolumeNode;
