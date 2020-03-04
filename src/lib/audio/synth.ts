import Tone from 'tone';
import { Source } from '@/lib/audio/source';
import { Time, Seconds, ContextTime } from '@/lib/audio/types';

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
export class Synth implements Source<SynthOptions> {
  private synth: Tone.PolySynth;

  constructor() {
    this.synth = new Tone.PolySynth(8, Tone.Synth);
  }

  public triggerAttackRelease(
    note: string,
    duration: Seconds,
    time: ContextTime,
    velocity?: number,
  ) {
    this.synth.triggerAttackRelease(note, duration, time, velocity);
    return this;
  }

  public disconnect(node: Tone.AudioNode): this {
    this.synth.connect(node);
    return this;
  }

  public connect(node: Tone.AudioNode): this {
    this.synth.connect(node);
    return this;
  }

  public set<K extends keyof SynthOptions>(o: { key: K, value: SynthOptions[K] }) {
    this.synth.set({ [o.key]: o.value });
  }

  public triggerAttack(note: string, time?: ContextTime, velocity?: number) {
    this.synth.triggerAttack(note, time, velocity);
    return {
      dispose: () => {
        this.synth.triggerRelease(note);
      },
    };
  }
}
