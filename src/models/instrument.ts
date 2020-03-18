import * as Audio from '@/lib/audio';
import uuid from 'uuid';
import * as t from '@/lib/io';
import { BuildingBlock } from '@/models/block';
import * as oly from '@/lib/olyger';
import { useSignal } from '@/utils';
import { context } from '@/lib/audio/online';
import { GraphNode } from '@/models/node';

export const InstrumentType = t.intersection([
  t.type({
    name: t.string,
  }),
  t.partial({
    channel: t.number,
    id: t.string,
    pan: t.number,
    volume: t.number,
    mute: t.boolean,
  }),
]);

export type IInstrument = t.TypeOf<typeof InstrumentType>;

export abstract class Instrument<
  S extends Audio.ObeoInstrument = Audio.ObeoInstrument,
  V extends string = any,
> implements BuildingBlock {
  public readonly name: oly.OlyRef<string>;
  public readonly id: string;

  // TODO what happens when set?
  /**
   * A type variable. For example, oscillator or soundfont.
   */
  public readonly type: oly.OlyRef<V>;

  /**
   * All of the possible options.
   */
  public types: V[];

  /**
   * The channel of the instrument, starting from 0. Undefined means it is connected directly to master.
   */
  public readonly channel: oly.OlyRef<number | undefined>;

  // TODO Same thing with these
  public readonly output = new GraphNode(Audio.createStereoPanner(), 'Panner');
  public readonly input = new GraphNode(Audio.createGain(), 'Gain');
  public readonly pan: oly.OlyRef<number>;
  public readonly volume: oly.OlyRef<number>;

  protected source: GraphNode<S>;

  constructor(
    type: V,
    types: V[],
    source: S,
    i: IInstrument,
  ) {
    this.type = oly.olyRef(type, 'Instrument Type');
    this.types = types;
    this.name = oly.olyRef(i.name, 'Instrument Name');
    this.id = i.id ?? uuid.v4();
    this.channel = oly.olyRef(i.channel, 'Instrument Channel');
    this.input.mute = !!i.mute;

    const {
      ref: pan,
    } = useSignal(this.output.node.pan, i.pan ?? 0, 'Pan');
    this.pan = pan;
    // this.panSignal = panSignal;

    const {
      ref: volume,
    } = useSignal(this.input.node.gain, i.volume ?? 0.8, 'Volume');
    this.volume = volume;
    // this.volumeSignal = volumeSignal;

    this.source = new GraphNode(source, this.name.value);
    this.source.connect(this.input);
    this.input.connect(this.output);
  }

  public triggerAttackRelease(note: Audio.Note, duration: Audio.Seconds, time: number, velocity?: number) {
    this.source.node.triggerAttackRelease(note, duration, time, velocity);
  }

  public triggerAttack(note: Audio.Note, velocity?: number) {
    return this.source.node.triggerAttack(note, undefined, velocity);
  }

  /**
   * Called when online status is returned. This can be removed when soundfonts are loaded locally.
   */
  public online() {
    // By default, do nothing
  }

  protected setSource(source: S) {
    this.source.replace(source);
  }
}
