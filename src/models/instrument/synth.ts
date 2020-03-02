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
    return new Synth({
      instrument: 'synth',
      type: 'fatsawtooth',
      name,
    });
  }

  private oscillatorType: Oscillators;

  constructor(i: ISynth) {
    super(
      i.type,
      ['fatsawtooth', 'sine', 'square', 'sawtooth', 'triangle'],
      new Audio.Synth(8, Tone.Synth),
      i,
    );

    this.oscillatorType = i.type;
    this.set({ key: 'envelope', value: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 } });

    this.set({ key: 'oscillator', value: { type: i.type } });
    this.type.onDidChange(({ onExecute, newValue, oldValue }) => {
      onExecute(() => {
        this.set({ key: 'oscillator', value: { type: newValue } });
        return () => this.set({ key: 'oscillator', value: { type: oldValue } });
      });
    });
  }

  public serialize() {
    return {
      instrument: literal('synth'),
      type: this.oscillatorType,
      volume: this.volume.value,
      pan: this.pan.value,
      name: this.name.value,
      id: this.id,
      channel: this.channel.value,
      mute: this.input.mute,
    };
  }
}

