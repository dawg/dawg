import Tone from 'tone';
import io from '@/modules/cerialize';
import * as Audio from '@/modules/audio';
import { Instrument } from '@/core/instrument/instrument';

export class Synth extends Instrument<Audio.SynthOptions> {
  private oscillatorType!: string;

  constructor() {
    super(new Tone.PolySynth(8, Tone.Synth));
    this.set({ key: 'envelope', value: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 } });
  }

  get type() {
    return this.oscillatorType;
  }

  @io.auto
  set type(type: string) {
    this.oscillatorType = type;
    this.set({ key: 'oscillator', value: { type } });
  }
}
