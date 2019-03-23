import * as t from 'io-ts';
import Tone from 'tone';
import { Serializable } from './serializable';

export const ChannelType = t.type({
  number: t.Int,
  name: t.string,
  id: t.string,
  effects: t.array(),
});

export type IChannel = t.TypeOf<typeof ChannelType>;

export class Channel implements Serializable<IChannel> {
  public static create(num: number) {
    const channel = new Channel();
    channel.number = num;
    channel.name = `Channel ${num}`;
    return channel;
  }

  public static deserialize(i: IChannel) {
    return new Channel();
  }

  public number: number;
  public name: string;
  @io.auto({ type: Effect, optional: true }) public effects: AnyEffect[] = [];
  public id: string;

  public left = new Tone.Meter();
  public right = new Tone.Meter();
  public split = new Tone.Split();

  private pannerNode = new Tone.Panner().toMaster().connect(this.split);
  // tslint:disable-next-line:member-ordering
  @io.attr('value')
  public panner = new Signal(this.pannerNode.pan);

  private gainNode = new Tone.Gain().connect(this.pannerNode);
  // tslint:disable-next-line:member-ordering
  @io.attr('value')
  public volume = new Signal(this.gainNode.gain);

  // tslint:disable-next-line:member-ordering
  public destination = this.gainNode;
  private connected = true;
  private muted = false;

  constructor(i: IChannel) {
    this.number = i.number;
    this.name = i.name;
    this.id = i.id || uuid.v4();
    // DEFAULTs
    this.volume.value = 0.7;
    this.split.left.connect(this.left);
    this.split.right.connect(this.right);
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

  public init() {
    const effects = this.effects;
    effects.forEach(
      (effect) => effect.init());

    if (effects.length === 0) {
      return;
    }

    for (const [i, effect] of effects.slice(1).entries()) {
      effects[i - 1].connect(effect);
    }

    effects[effects.length - 1].connect(this.destination);
  }
}
