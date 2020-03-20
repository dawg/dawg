import { ObeoVolumeNode } from '@/lib/audio/volume';
import { ObeoTrigger } from '@/lib/audio/util';
import { Setter } from '@/lib/reactor';

export interface ObeoInstrumentParameters {
  [key: string]: Setter<any>;
}

/**
 * An instrument.
 */
export type ObeoInstrument<T extends ObeoInstrumentParameters = {}> = ObeoTrigger & ObeoVolumeNode & T;
