import { Instrument } from '@/models';
import Tone from 'tone';

export default class Instr implements Instrument {
  private o: Instrument;
  private panner = new Tone.Panner().toMaster();
  private synth = new Tone.PolySynth(8, Tone.Synth).connect(this.panner);

  constructor(o: Instrument) {
    this.o = o;
    this.synth.set({ envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 } });
    this.type = 'fatsawtooth';
  }
  get name() {
    return this.o.name;
  }
  set name(name: string) {
    this.o.name = name;
  }
  get pan() {
    return this.o.pan;
  }
  set pan(pan: number) {
    this.panner.pan.value = pan;
    this.o.pan = pan;
  }
  get volume() {
    return this.o.volume;
  }
  set volume(volume: number) {
    this.synth.volume.value = volume;
    this.o.volume = volume;
  }
  get type() {
    return this.o.type;
  }
  set type(type: string) {
    this.o.type = type;
    this.synth.set({ oscillator: { type } });
  }
  public triggerAttackRelease(note: any, duration: string, time: string) {
    this.synth.triggerAttackRelease(note, duration, time);
  }
}
