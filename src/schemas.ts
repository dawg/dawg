import { autoserialize, autoserializeAs } from 'cerialize';
import Tone from 'tone';
import uuid from 'uuid';

import Part from '@/modules/audio/part';
import { toTickTime, allKeys } from './utils';

// These are all of the schemas for the project.
// Everything is annotated using `cerialize`.
// This allows us to serialize and deserialize between a class & a JSON object.
// This is super important as it provides a lot of flexibility.
// See `Instrument` for an example of the flexibility it provides.

// Things to note:
// 1. IDs (see `Pattern`, `Instrument`) are created using the uuid package. These IDs are used to reference objects.
// Ideally, the cerialize library could automatically create IDs when serializing and then replace the proper object
// when deserializing. It's an enhancement I want to make.

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

  /**
   * Refers to note ID. This are numbered 0 -> 87 and start from the higher frequencies.
   */
  @autoserialize public id!: number;
  /**
   * Duration in beats.
   */
  @autoserialize public duration!: number;

  /**
   * Time in beats.
   */
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
  public destination: Tone.AudioNode = Tone.Master;
  // tslint:disable-next-line:variable-name
  private _type!: string;
  // tslint:disable-next-line:variable-name
  private _mute!: boolean;
  // tslint:disable-next-line:variable-name
  private _channel: number | null = null;
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
      this.panner.disconnect(this.destination);
      this.connected = false;
    } else if (!mute && !this.connected) {
      this.panner.connect(this.destination);
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

  @autoserialize
  get channel() {
    return this._channel;
  }
  set channel(channel: number | null) {
    this._channel = channel;
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

  public triggerRelease(note: string) {
    this.synth.triggerRelease(note);
  }

  public triggerAttack(note: string) {
    this.synth.triggerAttack(note);
  }

  public connect(effect: Effect | Tone.AudioNode) {
    if (effect instanceof Effect) {
      this.panner.connect(effect.effect);
    } else {
      this.panner.connect(effect);
    }
  }

  public disconnect(effect: Effect | Tone.AudioNode) {
    if (effect instanceof Effect) {
      this.panner.disconnect(effect.effect);
    } else {
      this.panner.disconnect(effect);
    }
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

// tslint:disable-next-line:ban-types
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
type E = NonFunctionPropertyNames<Effect>;
type ToneEffect = Tone.AutoWah | Tone.Freeverb | Tone.Phaser;
export type EffectName = 'wah' | 'reverb' | 'phaser';

export const EffectMap = {
  wah: Tone.AutoWah,
  reverb: Tone.Freeverb,
  phaser: Tone.Phaser,
};

export class Effect {
  public static create(slot: number, type: EffectName) {
    const effect = new Effect();
    effect.type = type;
    effect.slot = slot;
    return effect;
  }

  @autoserialize public slot!: number; // 0 <= slot < maxSlots
  // tslint:disable-next-line:variable-name
  @autoserialize public _type!: EffectName;
  @autoserialize public options!: object;
  public effect!: ToneEffect;

  get type() {
    return this._type;
  }
  set type(type: EffectName) {
    this._type = type;

    if (!this.effect) {
      const cls = EffectMap[type];
      this.effect = new cls();
    }
  }

  public connect(effect: Effect | Tone.AudioNode) {
    if (effect instanceof Effect) {
      this.effect.connect(effect.effect);
    } else {
      this.effect.connect(effect);
    }
  }

  public disconnect(effect: Effect | Tone.AudioNode) {
    if (effect instanceof Effect) {
      this.effect.disconnect(effect.effect);
    } else {
      this.effect.disconnect(effect);
    }
  }
}


export class Channel {
  public static create(num: number) {
    const channel = new Channel();
    channel.number = num;
    channel.name = `Channel ${num}`;
    return channel;
  }
  @autoserialize public pan = 0;
  @autoserialize public volume = 0.7;
  @autoserialize public number!: number;
  @autoserialize public name!: string;
  @autoserialize public mute = false;
  @autoserializeAs(Effect) public effects: Effect[] = [];
}
