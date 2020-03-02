import Tone from 'tone';
export { TransportTime, Time, ContextTime, Beat } from '@/lib/audio/types';
export { Controller, PointController } from '@/lib/audio/controller';
export { Transport, TransportEvent, TransportEventController } from '@/lib/audio/transport';
export { Signal } from '@/lib/audio/signal';
export { Source } from '@/lib/audio/source/source';
export * from '@/lib/audio/source/soundfont';
export * from '@/lib/audio/source/synth';
export { Player } from '@/lib/audio/player';
export { Context } from '@/lib/audio/context';

// FIXME Fix this
export const Master = (Tone.Master as any).output as AudioNode;
export const ToneMaster = Tone.Master;
