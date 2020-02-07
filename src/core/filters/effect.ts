import Tone from 'tone';
import uuid from 'uuid';
import * as t from '@/lib/io';
import { EffectOptions, EffectName, EffectTones, EffectMap } from '@/core/filters/effects';
import { EffectDefaults } from '@/core/filters/defaults';
import { Serializable } from '@/core/serializable';

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

  public effect!: EffectTones[T];
  private destination: Tone.AudioNode | null = null;

  constructor(i: IEffect) {
    this.slot = i.slot;
    this.id = i.id;
    this.type = i.type as T;
    // FIXME Remove any cast
    this.options = i.options as any;
    // FIXME FIx this because we shouldn't have to use any type
    this.effect = new EffectMap[this.type]() as any;
    // FIXME actually set options
  }

  get wet() {
    return this.effect.wet;
  }

  public connect(effect: AnyEffect | Tone.AudioNode) {
    if (effect instanceof Effect) {
      this.effect.connect(effect.effect);
      this.destination = effect.effect;
    } else {
      this.effect.connect(effect);
      this.destination = effect;
    }
  }

  public disconnect() {
    if (this.destination) {
      this.effect.disconnect(this.destination);
      this.destination = null;
    }
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
    this.effect[o.key] = o.value;
  }
}

export class AnyEffect extends Effect<EffectName> {}
