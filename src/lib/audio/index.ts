import Tone from 'tone';
export { TransportTime, Time, Ticks, ContextTime, Beat, Seconds } from '@/lib/audio/types';
export { Controller, PointController } from '@/lib/audio/controller';
export { Transport, TransportEvent, TransportEventController } from '@/lib/audio/transport';
export { Signal } from '@/lib/audio/signal';
export { Source } from '@/lib/audio/source';
export * from '@/lib/audio/soundfont';
export * from '@/lib/audio/synth';
export { Player } from '@/lib/audio/player';
export { Context } from '@/lib/audio/context';
export { GraphNode } from '@/lib/audio/node';

// FIXME Fix this
export const Master = (Tone.Master as any).output as AudioNode;
export const ToneMaster = Tone.Master;
