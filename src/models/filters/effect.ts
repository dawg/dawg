import uuid from 'uuid';
import * as t from '@/lib/io';
import { EffectOptions, EffectName, EffectTones } from '@/models/filters/effects';
import { EffectDefaults } from '@/models/filters/defaults';
import { Serializable } from '@/models/serializable';
import { GraphNode } from '@/models/node';
import * as Audio from '@/lib/audio';
import { keys } from '@/lib/std';

export const EffectType = t.type({
  slot: t.number,
  type: t.union([
    t.literal('Wah'),
    t.literal('Reverb'),
    t.literal('Phaser'),
    t.literal('Bit Crusher'),
    t.literal('Ping Pong Delay'),
    t.literal('Chorus'),
    t.literal('Tremolo'),
    t.literal('Distortion'),
  ]),
  options: t.object, // FIXME
  id: t.string,
});

const createEffect = <T extends EffectName>(type: EffectName): EffectTones[T] => {
  switch (type) {
    case 'Distortion':
      return Audio.createDistortion();
  }
};

export type IEffect = t.TypeOf<typeof EffectType>;

export class Effect<T extends EffectName> implements Serializable<IEffect> {
  public static create<E extends EffectName>(slot: number, type: E) {
    const effect = new Effect<E>({
      slot,
      type,
      id: uuid.v4(),
      options: EffectDefaults[type],
    });
    return effect;
  }

  public slot: number; // 0 <= slot < maxSlots
  public type: T;
  public options: EffectOptions[T];
  public id = uuid.v4();

  public effect: GraphNode<Audio.ObeoEffect>;

  constructor(i: IEffect) {
    // FIXME make this undoable
    this.slot = i.slot;
    this.id = i.id;
    this.type = i.type as T;
    // FIXME Remove any cast
    this.options = i.options as any;
    this.effect = new GraphNode(createEffect(this.type), this.type);

    keys(this.options).forEach((key) => {
      (this.effect.node as any)[key] = this.options[key];
    });
  }

  get wet() {
    return this.effect.node.wet;
  }

  public serialize() {
    return {
      slot: this.slot,
      type: this.type,
      id: this.id,
      options: this.options,
    };
  }

  public set<K extends keyof EffectOptions[T] & keyof EffectTones[T]>(
    o: { key: K, value: EffectOptions[T][K] & EffectTones[T][K] },
  ) {
    this.options[o.key] = o.value;
    // This any cast should be addressed when this file is refactored
    (this.effect.node as any)[o.key] = o.value;
  }
}

export class AnyEffect extends Effect<EffectName> {}
