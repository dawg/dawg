import Tone from 'tone';
import * as Audio from '@/lib/audio';
import uuid from 'uuid';
import * as t from '@/lib/io';
import { BuildingBlock } from '@/models/block';
import * as oly from '@/olyger';
import { GraphNode } from '@/node';

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

export abstract class Instrument<T, V extends string> extends BuildingBlock {
  public name: string;
  public id: string;

  /**
   * A type variable. For example, oscillator or soundfont.
   */
  public abstract type: V;

  /**
   * All of the possible options.
   */
  public abstract types: V[];

  public channel: oly.OlyRef<number | undefined>;

  protected source: GraphNode<Audio.Source<T> | null>;
  // tslint:disable-next-line:member-ordering
  private panner = new Tone.Panner().toMaster();
  private connected = true;

  // tslint:disable-next-line:member-ordering
  public pan = new Audio.Signal(this.panner.pan, -1, 1);

  private node = new GraphNode(new Tone.Gain().connect(this.panner));

  // tslint:disable-next-line:member-ordering
  public volume = new Audio.Signal(this.node.node.gain, 0, 1);

  constructor(source: Audio.Source<T> | null, destination: GraphNode, i: IInstrument) {
    super();
    this.source = new GraphNode(source);
    this.source.connect(this.node);

    this.name = i.name;
    this.id = i.id || uuid.v4();
    this.channel = oly.olyRef(i.channel);
    this.node.mute = !!i.mute;
    this.pan.value = i.pan || 0;
    this.volume.value = i.volume === undefined ? 0.8 : i.volume;
    this.node.connect(destination);
  }

  public triggerAttackRelease(note: string, duration: Audio.Time, time: number, velocity?: number) {
    if (this.source.node) {
      this.source.node.triggerAttackRelease(note, duration, time, velocity);
    }
  }

  public triggerRelease(note: string) {
    if (this.source.node) {
      this.source.node.triggerRelease(note);
    }
  }

  public triggerAttack(note: string, velocity?: number) {
    if (this.source.node) {
      this.source.node.triggerAttack(note, undefined, velocity);
    }
  }

  public set<K extends keyof T>(o: { key: K, value: T[K] }) {
    if (this.source.node) {
      this.source.node.set(o);
    }
  }

  /**
   * Called when online status is returned. This can be removed when soundfonts are loaded locally.
   */
  public online() {
    // By default, do nothing
  }

  protected setSource(source: Audio.Source<T> | null) {
    this.source.replace(source);
  }
}
