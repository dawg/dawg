import Tone from 'tone';
import * as t from '@/lib/io';
import * as Audio from '@/lib/audio';
import { Instrument, InstrumentType } from '@/models/instrument/instrument';
import { Serializable } from '@/models/serializable';
import { literal } from '@/lib/std';

export const SynthType = t.intersection([
  t.type({
    instrument: t.literal('synth'),
    type: t.union([
      t.literal('fatsawtooth'),
      t.literal('sine'),
      t.literal('square'),
      t.literal('sawtooth'),
      t.literal('triangle'),
    ]),
  }),
  InstrumentType,
]);

export type Oscillators = ISynth['type'];

export type ISynth = t.TypeOf<typeof SynthType>;

export class Synth extends Instrument<Audio.SynthOptions, Oscillators> implements Serializable<ISynth> {
  public static create(name: string) {
    return new Synth(Tone.Master, {
      instrument: 'synth',
      type: 'fatsawtooth',
      name,
    });
  }

  public types: Oscillators[] = ['fatsawtooth', 'sine', 'square', 'sawtooth', 'triangle'];

  private oscillatorType: Oscillators;

  constructor(destination: Tone.AudioNode, i: ISynth) {
    super(new Audio.Synth(8, Tone.Synth), destination, i);
    this.oscillatorType = i.type;
    this.type = i.type;
    this.set({ key: 'envelope', value: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 } });
  }

  get type() {
    return this.oscillatorType;
  }

  set type(type: Oscillators) {
    this.oscillatorType = type;
    this.set({ key: 'oscillator', value: { type } });
  }

  public serialize() {
    return {
      instrument: literal('synth'),
      type: this.oscillatorType,
      volume: this.volume.value,
      pan: this.pan.value,
      name: this.name,
      id: this.id,
      channel: this.channel,
      mute: this.mute,
    };
  }
}

