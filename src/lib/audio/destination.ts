import { GraphNode } from '@/lib/audio/node';
import { context } from '@/lib/audio/context';
import { Decibels } from '@/lib/audio/types';

interface DestinationOptions {
  volume: Decibels;
  mute: boolean;
}

export class Destination extends GraphNode<AudioNode> {
  constructor(options: Partial<DestinationOptions>);
  constructor() {
    super(context.createGain());
    this.connect(new GraphNode(context.destination));
  }
}
