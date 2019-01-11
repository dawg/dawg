import { autoserialize, autoserializeAs } from 'cerialize';
import Tone from 'tone';
import uuid from 'uuid';

import Part from '@/modules/audio/part';
import { toTickTime, allKeys } from './utils';


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
  public static create(instrumentId: string) {
    const score = new Score();
    score.instrumentId = instrumentId;
    score.id = uuid.v4();
    return score;
  }
  @autoserialize public id!: string;
  @autoserialize public instrumentId!: string;
  @autoserializeAs(Note) public notes: Note[] = [];
}

export class Pattern {
  public static create(name: string) {
    const pattern = new Pattern();
    pattern.name = name;
    return pattern;
  }
  @autoserialize public id: string = uuid.v4();
  @autoserialize public name!: string;
  @autoserializeAs(Score) public scores: Score[] = [];
  public part = new Part<Note>();
}

export interface IInstrument {
  name: string;
  pan: number;
  volume: number;
  type: string;
  mute: boolean;
}

export class Instrument implements IInstrument {
  public static create(o: IInstrument) {
    const instrument = new Instrument();
    instrument.name = o.name;
    instrument.pan = o.pan;
    instrument.volume = o.volume;
    instrument.type = o.type;
    instrument.mute = o.mute;
    instrument.id = uuid.v4();
    return instrument;
  }
  public static default(name: string) {
    return Instrument.create({
      name,
      pan: 0,
      volume: 0,
      type: 'fatsawtooth',
      mute: false,
    });
  }
  @autoserialize public name!: string;
  @autoserialize public id!: string;
  // tslint:disable-next-line:variable-name
  private _type!: string;
  // tslint:disable-next-line:variable-name
  private _mute!: boolean;
  private connected = false;
  private panner = new Tone.Panner();
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

  get mute() {
    return this._mute;
  }
  @autoserialize
  set mute(mute: boolean) {
    this._mute = mute;
    if (mute && this.connected) {
      this.panner.disconnect(Tone.Master);
      this.connected = false;
    } else if (!mute && !this.connected) {
      this.panner.toMaster();
      this.connected = true;
    }
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

  /**
   * The callback for the part.
   */
  public callback(time: number, note: Note) {
    const duration = toTickTime(note.duration);
    const value = allKeys[note.id].value;
    this.triggerAttackRelease(value, duration, time);
  }
}
