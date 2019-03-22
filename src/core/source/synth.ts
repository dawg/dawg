import Tone from 'tone';
import io from '@/modules/cerialize';
import { Source } from '@/core/source';

export class Synth extends Source {
  private oscillatorType!: string;

  constructor() {
    super(new Tone.PolySynth(8, Tone.Synth));
    this.source.set({ envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 } });
  }

  get type() {
    return this.oscillatorType;
  }

  @io.auto
  set type(type: string) {
    this.oscillatorType = type;
    this.synth.set({ oscillator: { type } });
  }
}
