import Tone from 'tone';

export { TransportTime, Time, ContextTime } from '@/modules/audio/types';
export { Controller } from '@/modules/audio/controller';
export { Transport } from '@/modules/audio/transport';
export { Signal } from '@/modules/audio/signal';
export { Source } from '@/modules/audio/source/source';
export { Soundfont, SoundfontOptions } from '@/modules/audio/source/soundfont';
export { Synth, SynthOptions } from '@/modules/audio/source/synth';
export { Player } from '@/modules/audio/player';

// @ts-ignore
export const context = Tone.context._context as unknown as AudioContext;
