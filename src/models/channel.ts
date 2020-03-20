import * as t from '@/lib/io';
import uuid from 'uuid';
import * as Audio from '@/lib/audio';
import { Serializable } from '@/models/serializable';
import { EffectType, AnyEffect, Effect } from '@/models/filters/effect';
import * as oly from '@/lib/olyger';
import { GraphNode } from '@/models/node';
import { EffectName } from '@/models/filters/effects';
import { getLogger } from '@/lib/log';
import { useSignal } from '@/utils';
import { context } from '@/lib/audio/online';
import { createGain } from '@/lib/audio/gain';
import { createMeter } from '@/lib/audio/meter';
import { destination } from '@/models/node';

const logger = getLogger('channel', { level: 'debug' });

export const ChannelTypeRequired = t.type({
  number: t.number,
  name: t.string,
  id: t.string,
  pan: t.number,
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
      pan: 0,
      volume: 0.7,
      mute: false,
    });
  }

  public number: number;
  public name: string;
  public effects: Readonly<AnyEffect[]>;
  public id: string;

  public readonly pan: oly.OlyRef<number>;
  public readonly volume: oly.OlyRef<number>;
  public readonly mute: oly.OlyRef<boolean>;

  public readonly input = new GraphNode(createGain(), 'Gain');
  public readonly output = new GraphNode(Audio.createStereoPanner(), 'Panner');

  public readonly left = new GraphNode(createMeter());
  public readonly right = new GraphNode(createMeter());
  private readonly split = new GraphNode(Audio.createChannelSplitter(2));

  // tslint:disable-next-line:variable-name
  private readonly _effects: AnyEffect[];

  // private readonly panSignal: Audio.Signal;
  // private readonly volumeSignal: Audio.Signal;


  constructor(i: IChannel) {
    this.number = i.number;
    this.name = i.name;
    this.id = i.id;

    this.input.connect(this.output);

    // Note this is a bit hacky
    // Right now, each graph node can only have one output
    // If we were to do this.output.connect(this.split) it would override the connection that happens below!
    this.output.node.connect(this.split.node);

    const {
      signal: panSignal,
      ref: pan,
    } = useSignal(this.output.node.pan, i.pan ?? 0, 'Pan');
    this.pan = pan;
    // this.panSignal = panSignal;

    const {
      signal: volumeSignal,
      ref: volume,
    } = useSignal(this.input.node.gain, i.volume ?? 0.8, 'Volume');
    this.volume = volume;
    // this.volumeSignal = volumeSignal;

    const connect = (isMuted: boolean) => {
      const newDestination = isMuted ? undefined : destination;
      this.output.connect(newDestination);
    };

    this.mute = oly.olyRef(i.mute, 'Channel Mute');
    this.mute.onDidChange(({ onExecute, newValue, oldValue }) => {
      onExecute(() => {
        connect(newValue);
        return () => connect(oldValue);
      });
    });

    // Do initial connection
    connect(i.mute);

    // Connecting the visualizers
    this.split.connect(this.left, 0);
    this.split.connect(this.right, 1);

    const effects = oly.olyArr(i.effects.map((iEffect) => {
      return new Effect(iEffect);
    }), 'Effect');

    effects.onDidRemove(({ items, onExecute }) => {
      onExecute(() => {
        return items.map((item) => item.effect.dispose());
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
      pan: this.pan.value,
      volume: this.volume.value,
      mute: this.mute.value,
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
