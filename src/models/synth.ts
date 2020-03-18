import * as t from '@/lib/io';
import * as Audio from '@/lib/audio';
import { Instrument, InstrumentType } from '@/models/instrument';
import { Serializable } from '@/models/serializable';
import { literal } from '@/lib/std';

export const SynthType = t.intersection([
  t.type({
    instrument: t.literal('synth'),
    type: t.union([
      t.literal('custom'),
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

export class Synth extends Instrument<
  Audio.ObeoSynth,
  Oscillators
> implements Serializable<ISynth> {
  public static create(name: string) {
    return new Synth({
      instrument: 'synth',
      type: 'sine',
      name,
    });
  }

  constructor(i: ISynth) {
    super(
      i.type,
      ['custom', 'sine', 'square', 'sawtooth', 'triangle'],
      Audio.createSynth({
        envelope: {
          attack: 0.005,
          decay: 0.1,
          sustain: 0.3,
          release: 1,
        },
      }),
      i,
    );

    this.source.node.type.value = i.type;
    this.type.onDidChange(({ onExecute, newValue, oldValue }) => {
      onExecute(() => {
        this.source.node.type.value = newValue;
        return () => this.source.node.type.value = oldValue;
      });
    });
  }

  public serialize() {
    return {
      instrument: literal('synth'),
      type: this.type.value,
      volume: this.volume.value,
      pan: this.pan.value,
      name: this.name.value,
      id: this.id,
      channel: this.channel.value,
      mute: this.input.mute,
    };
  }
}

