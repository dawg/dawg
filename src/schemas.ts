import { autoserialize, autoserializeAs } from 'cerialize';
import Tone from 'tone';
import Part from './modules/audio/part';
import { VuexModule, Mutation } from 'vuex-module-decorators';
import { Module } from 'vuex';

export interface INote {
  id: number;
  duration: number;
  time: number;
}

export class Note implements INote {
  public static create(o: INote) {
    const note = new Note();
    note.id = o.id;
    note.duration = o.duration;
    note.time = o.time;
    return note;
  }
  @autoserialize public id!: number;
  @autoserialize public duration!: number;
  @autoserialize public time!: number;
}

export class Score {
  public static create(instrument: string) {
    const score = new Score();
    score.instrument = instrument;
    return score;
  }
  @autoserialize public instrument!: string; // TODO try to serialize actual instrument
  @autoserializeAs(Note) public notes: Note[] = [];
}

export class Pattern {
  public static create(name: string) {
    const pattern = new Pattern();
    pattern.name = name;
    return pattern;
  }
  @autoserialize public name!: string;
  @autoserializeAs(Score) public scores: Score[] = [];
  public part = new Part();
}

export interface IInstrument {
  name: string;
  pan: number;
  volume: number;
  type: string;
}

export class Instrument implements IInstrument {
  public static create(o: IInstrument) {
    const instrument = new Instrument();
    instrument.name = o.name;
    instrument.pan = o.pan;
    instrument.volume = o.volume;
    instrument.type = o.type;
    return instrument;
  }
  public static default(name: string) {
    return Instrument.create({
      name,
      pan: 0,
      volume: 0,
      type: 'fatsawtooth',
    });
  }
  @autoserialize public name!: string;
  // tslint:disable-next-line:variable-name
  private _type!: string;
  private panner = new Tone.Panner().toMaster();
  private synth = new Tone.PolySynth(8, Tone.Synth).connect(this.panner);

  constructor() {
    this.synth.set({ envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 } });
  }

  get pan() {
    return this.panner.pan.value;
  }
  @autoserialize
  set pan(pan: number) {
    this.panner.pan.value = pan;
  }

  @autoserialize
  get volume() {
    return this.synth.volume.value;
  }
  set volume(volume: number) {
    this.synth.volume.value = volume;
  }

  get type() {
    return this._type;
  }
  @autoserialize
  set type(type: string) {
    this._type = type;
    this.synth.set({ oscillator: { type } });
  }
  public triggerAttackRelease(note: string, duration: string, time: number) {
    this.synth.triggerAttackRelease(note, duration, time);
  }
}

export class Project extends VuexModule {
  @autoserialize public bpm = 128;
  @autoserializeAs(Pattern) public patterns: Pattern[] = [];
  @autoserializeAs(Instrument) public instruments: Instrument[] = [];
  constructor(module?: Module<any, any>) {
    super(module || {});
  }

  @Mutation
  public reset(payload: Project) {
    Object.assign(this, payload);
  }

  @Mutation
  public addInstrument() {
    let name: string;
    let count = 0;
    while (true) {
      name = `Instrument ${count}`;
      let found = false;
      for (const instrument of this.instruments) {
        if (instrument.name === name) {
          found = true;
          break;
        }
      }

      if (!found) {
        break;
      }

      count++;
    }
    this.instruments.push(Instrument.default(name));
  }

  get patternLookup() {
    const patterns: {[k: string]: Pattern} = {};
    this.patterns.forEach((pattern) => {
      patterns[pattern.name] = pattern;
    });
    return patterns;
  }
}
