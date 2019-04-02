import * as t from 'io-ts';
import uuid from 'uuid';
import Tone from 'tone';
import * as Audio from '@/modules/audio';
import { Serializable } from './serializable';
import { EffectType, AnyEffect, Effect } from '@/core/filters/effect';

export const ChannelTypeRequired = t.type({
  number: t.number,
  name: t.string,
  id: t.string,
  panner: t.number,
  volume: t.number,
  mute: t.boolean,
});

export const ChannelTypePartial = t.partial({
  effects: t.array(EffectType),
});

export const ChannelType = t.intersection([ChannelTypeRequired, ChannelTypePartial]);

export type IChannel = t.TypeOf<typeof ChannelType>;

export class Channel implements Serializable<IChannel> {
  public static create(num: number) {
    return new Channel({
      number: num,
      name: `Channel ${num}`,
      id: uuid.v4(),
      effects: [],
      panner: 0,
      volume: 0.7,
      mute: false,
    });
  }

  public number: number;
  public name: string;
  public effects: AnyEffect[];
  public id: string;

  public left = new Tone.Meter();
  public right = new Tone.Meter();
  public split = new Tone.Split();

  private pannerNode = new Tone.Panner().toMaster().connect(this.split);

  /**
   * The panner for the channel.
   */
  // tslint:disable-next-line:member-ordering
  public panner = new Audio.Signal(this.pannerNode.pan, -1, 1);

  private gainNode = new Tone.Gain().connect(this.pannerNode);

  /**
   * The volume for the channel.
   */
  // tslint:disable-next-line:member-ordering
  public volume = new Audio.Signal(this.gainNode.gain, 0, 1);

  // tslint:disable-next-line:member-ordering
  public destination = this.gainNode;
  private connected = true;
  private muted: boolean;

  constructor(i: IChannel) {
    this.number = i.number;
    this.name = i.name;
    this.id = i.id;

    this.volume.value = i.volume;
    this.panner.value = i.panner;

    this.muted = i.mute;
    this.mute = i.mute;

    // Connecting the visualizers
    this.split.left.connect(this.left);
    this.split.right.connect(this.right);

    this.effects = (i.effects || []).map((iEffect) => {
      return new Effect(iEffect);
    });

    if (this.effects.length === 0) {
      return;
    }

    for (const [index, effect] of this.effects.slice(1).entries()) {
      this.effects[index - 1].connect(effect);
    }

    this.effects[this.effects.length - 1].connect(this.destination);
  }

  get mute() {
    return this.muted;
  }

  set mute(mute: boolean) {
    this.muted = mute;
    if (mute && this.connected) {
      this.pannerNode.disconnect(Tone.Master);
      this.connected = false;
    } else if (!mute && !this.connected) {
      this.pannerNode.connect(Tone.Master);
      this.connected = true;
    }
  }

  get input() {
    return this.effects.length ? this.effects[0].effect : this.destination;
  }

  public serialize() {
    return {
      number: this.number,
      name: this.name,
      id: this.id,
      effects: this.effects.map((effect) => effect.serialize()),
      panner: this.panner.value,
      volume: this.volume.value,
      mute: this.mute,
    };
  }
}
