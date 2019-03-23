import Tone from 'tone';
import uuid from 'uuid';
import * as t from 'io-ts';
import { EffectOptions, EffectName, EffectTones, EffectMap } from '@/core/filters/effects';
import { EffectDefaults } from '@/core/filters/defaults';
import { Serializable } from '../serializable';

export const EffectType = t.type({
  slot: t.number,
  type: t.union([
    t.literal('Wah'),
    t.literal('Reverb'),
    t.literal('Phaser'),
    t.literal(''Bit Crusher''),
    t.literal(''Ping Pong Delay''),
    t.literal('Compressor'),
    t.literal('EQ3'),
    t.literal('Limiter'),
    t.literal('Chorus'),
    t.literal('Tremolo'),
    t.literal('Distortion'),
  ]),
  options: t.object, // TODO
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
    // TODO Remove any cast
    this.options = i.options as any;
    this.effect = new EffectMap[this.type]();
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
}

export class AnyEffect extends Effect<EffectName> {}
