import Tone from 'tone';
import { Source } from '@/modules/audio/source/source';

export interface SynthOptions {
  envelope: {
    attack: number,
    decay: number,
    sustain: number,
    release: number,
  };
  oscillator: {
    type: string,
  };
}

/**
 * An instrument source. Uses `Tone` under the hood.
 */
export class Synth extends Tone.PolySynth implements Source<SynthOptions> {
  public set<K extends keyof SynthOptions>(o: { key: K, value: SynthOptions[K] }) {
    super.set({ [o.key]: o.value });
  }

  public triggerAttack(note: string, velocity ?: number) {
    return super.triggerAttack(note, undefined, velocity);
  }
}
