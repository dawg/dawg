import * as t from '@/lib/io';
import uuid from 'uuid';
import Tone from 'tone';
import * as Audio from '@/lib/audio';
import { Serializable } from '@/models/serializable';
import { EffectType, AnyEffect, Effect } from '@/models/filters/effect';
import * as oly from '@/olyger';
import { GraphNode, masterNode } from '@/node';
import { EffectName } from '@/models/filters/effects';

export const ChannelTypeRequired = t.type({
  number: t.number,
  name: t.string,
  id: t.string,
  panner: t.number,
  volume: t.number,
  mute: t.boolean,
});

export const ChannelTypePartial = t.type({
  effects: t.array(EffectType),
});

export const ChannelType = t.intersection([ChannelTypeRequired, ChannelTypePartial]);

export type IChannel = t.TypeOf<typeof ChannelType>;

const initiate = (effects: AnyEffect[], { items, index }: { items: AnyEffect[], index: number }) => {
  if (items.length === 0) {
    return;
  }

  items.slice(0, items.length - 1).forEach((_, ind) => {
    items[ind].effect.connect(items[ind + 1].effect);
  });

  const nodeReplaced = effects[index + items.length].effect ?? masterNode;
  nodeReplaced.redirect(items[0].effect);
  items[items.length - 1].effect.connect(nodeReplaced);
};

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
  public effects: Readonly<AnyEffect[]>;
  public id: string;

  public left = new Tone.Meter();
  public right = new Tone.Meter();
  public split = new Tone.Split();

  // tslint:disable-next-line:variable-name
  private _effects: AnyEffect[];
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
  public destination = new GraphNode(this.gainNode);
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

    const effects = oly.olyArr(i.effects.map((iEffect) => {
      return new Effect(iEffect);
    }));

    // TODO make sure this all works
    effects.onDidAdd(({ items: added, subscriptions, startingIndex: index }) => {
      subscriptions.push({
        execute: () => {
          return {
            undo: () => {
              added.forEach((item) => item.dispose());
            },
          };
        },
      });

      initiate(effects, { items: added, index });
    });


    this.effects = effects;
    this._effects = effects;

    initiate(effects, { items: effects, index: 0 });
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

  public addEffect(name: EffectName, i: number) {
    let toInsert = 0;
    for (; toInsert < this.effects.length; toInsert++) {
      const effect = this.effects[toInsert];
      if (effect.slot === i) {
        // An effect already exists in the slot
        return;
      }

      if (effect.slot > i) {
        break;
      }
    }

    const newEffect = Effect.create(i, name);
    this._effects.splice(toInsert, 0, newEffect);
  }

  public deleteEffect(i: number) {
    this._effects.splice(i);
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
