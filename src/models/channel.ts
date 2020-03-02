import * as t from '@/lib/io';
import uuid from 'uuid';
import Tone from 'tone';
import * as Audio from '@/lib/audio';
import { Serializable } from '@/models/serializable';
import { EffectType, AnyEffect, Effect } from '@/models/filters/effect';
import * as oly from '@/olyger';
import { GraphNode, masterNode } from '@/node';
import { EffectName } from '@/models/filters/effects';
import { getLogger } from '@/lib/log';

const logger = getLogger('channel', { level: 'debug' });

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

  public left = new GraphNode(new Tone.Meter());
  public right = new GraphNode(new Tone.Meter());
  private split = new GraphNode(new Tone.Split());
  private splitLeft = new GraphNode(this.split.node.left);
  private splitRight = new GraphNode(this.split.node.left);

  // tslint:disable-next-line:variable-name
  private _effects: AnyEffect[];
  private output = new GraphNode(new Tone.Panner(), 'Panner');

  /**
   * The panner for the channel.
   */
  // tslint:disable-next-line:member-ordering
  public panner = new Audio.Signal(this.output.node.pan, -1, 1);

  // tslint:disable-next-line:member-ordering
  public input = new GraphNode(new Tone.Gain(), 'Gain');

  /**
   * The volume for the channel.
   */
  // TODO
  // tslint:disable-next-line:member-ordering
  public volume = new Audio.Signal(this.input.node.gain, 0, 1);

  private connected = true;
  private muted: oly.OlyRef<boolean>;

  constructor(i: IChannel) {
    this.number = i.number;
    this.name = i.name;
    this.id = i.id;

    this.input.connect(this.output);
    this.output.toMaster();

    // Note this is a bit hacky
    // Right now, each graph node can only have one output
    // If we were to do this.output.connect(this.split) it would override the above this.output.toMaster()
    this.output.node.connect(this.split.node);

    this.volume.value = i.volume;
    this.panner.value = i.panner;

    this.muted = oly.olyRef(i.mute);
    this.mute = i.mute;

    // Connecting the visualizers
    this.splitLeft.connect(this.left);
    this.splitRight.connect(this.right);

    const effects = oly.olyArr(i.effects.map((iEffect) => {
      return new Effect(iEffect);
    }));

    effects.onDidRemove(({ items, subscriptions }) => {
      subscriptions.push({
        execute: () => {
          const disposers = items.map((item) => item.effect.dispose());
          return {
            undo: () => {
              disposers.forEach((disposer) => disposer.dispose());
            },
          };
        },
      });
    });

    effects.onDidAdd(({ items: added, subscriptions, startingIndex: index }) => {
      subscriptions.push({
        execute: () => {
          logger.debug(`Added ${added.length} effect(s) at index ${index}`);
          this.initiate({ items: added, index });

          return {
            undo: () => {
              logger.debug(`Disconnecting ${added.length} effect(s)`);
              added.forEach((item) => item.effect.dispose());
            },
          };
        },
      });
    });


    this.effects = effects;
    this._effects = effects;

    this.initiate({ items: effects, index: 0 });
  }

  get mute() {
    // TODO
    return this.muted.value;
  }

  set mute(mute: boolean) {
    this.muted.value = mute;
    if (mute && this.connected) {
      this.output.connect();
      this.connected = false;
    } else if (!mute && !this.connected) {
      this.output.connect(masterNode);
      this.connected = true;
    }
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
    this._effects.splice(i, 1);
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

  private initiate({ items, index }: { items: AnyEffect[], index: number }) {
    if (items.length === 0) {
      return;
    }

    items.slice(0, items.length - 1).forEach((_, ind) => {
      items[ind].effect.connect(items[ind + 1].effect);
    });

    const nodeReplaced = this.effects[index + items.length]?.effect ?? this.input;
    nodeReplaced.redirect(items[0].effect);
    items[items.length - 1].effect.connect(nodeReplaced);
  }
}
