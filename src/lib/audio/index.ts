import Tone from 'tone';
export { TransportTime, Time, Ticks, ContextTime, Beat, Seconds } from '@/lib/audio/types';
export { Controller, PointController } from '@/lib/audio/controller';
export { Transport, TransportEvent, TransportEventController } from '@/lib/audio/transport';
export { Signal } from '@/lib/audio/signal.old';
export { Source } from '@/lib/audio/source.old';
export * from '@/lib/audio/soundfont';
export * from '@/lib/audio/synth.old';
export { Player } from '@/lib/audio/player';
export { Context } from '@/lib/audio/context';
export { GraphNode, masterNode } from '@/lib/audio/node';

// TODO
export const Master = (Tone.Master as any).output as AudioNode;
export const ToneMaster = Tone.Master;
