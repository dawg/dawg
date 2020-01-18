import Tone from 'tone';
export { TransportTime, Time, ContextTime, Beat } from '@/modules/audio/types';
export { Controller } from '@/modules/audio/controller';
export { Transport, TransportEvent, TransportEventController } from '@/modules/audio/transport';
export { Signal } from '@/modules/audio/signal';
export { Source } from '@/modules/audio/source/source';
export * from '@/modules/audio/source/soundfont';
export * from '@/modules/audio/source/synth';
export { Player } from '@/modules/audio/player';
export { Context } from '@/modules/audio/context';

// FIXME Fix this
export const Master = (Tone.Master as any).output as AudioNode;
