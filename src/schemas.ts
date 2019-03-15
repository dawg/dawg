import pth from 'path';
import * as io from '@/modules/cerialize';
import Tone from 'tone';
import uuid from 'uuid';

import Transport from '@/modules/audio/transport';
import { toTickTime, allKeys, ConstructorOf, disposeHelp } from './utils';
import { Controller, Time, Signal } from '@/modules/audio';

// This is my least favorite file
// I'm sorry for anyone who has to read it

// These are all of the schemas for the project.
// Everything is annotated using `cerialize`.
// This allows us to serialize and deserialize between a class & a JSON object.
// This is super important as it provides a lot of flexibility.
// See `Instrument` for an example of the flexibility it provides.

// Things to note:
// 1. IDs (see `Pattern`, `Instrument`) are created using the uuid package. These IDs are used to reference objects.
// Ideally, the cerialize library could automatically create IDs when serializing and then replace the proper object
// when deserializing. It's an enhancement I want to make.

export type Beats = number;
export type Range = number;

export interface IElement {
  row: number;
  duration: number;
  time: number;
}

// TODO Consolidate all Element classes!
export abstract class Element implements IElement {

  public static copy<T extends Element>(element: T, cls: ConstructorOf<T>): T {
    const newElement = new cls();
    newElement.duration = element.duration;
    newElement.row = element.row;
    newElement.time = element.time;
    return newElement;
  }

  public readonly abstract component: string;

  /**
   * Refers to row where the element is placed.
   * For notes, these are numbered 0 -> 87 and start from the higher frequencies.
   */
  @io.auto public row!: number;

  /**
   * Duration in beats.
   */
  // tslint:disable-next-line:variable-name
  public _duration!: number;

  @io.auto
  get duration() {
    return this._duration;
  }

  set duration(value: number) {
    this._duration = value;

    if (this.transport && this.eventId) {
      const event = this.transport.get(this.eventId);

      if (!(event instanceof Tone.TransportRepeatEvent)) {
        return;
      }

      event.duration = new Tone.Ticks(toTickTime(value));
    }
  }

  /**
   * Time in beats.
   */
  @io.auto public time!: number;

  private eventId?: string;
  private transport?: Transport;

  get tickTime() {
    return toTickTime(this.time);
  }

  constructor(o?: IElement) {
    if (o) {
      this.row = o.row;
      this.duration = o.duration;
      this.time = o.time;
    }
  }

  public remove(transport: Transport) {
    if (this.eventId !== undefined) {
      transport.clear(this.eventId);
    }
  }

  public schedule(transport: Transport) {
    this.transport = transport;
    this.eventId = this.add(transport);
  }

  public dispose() {
    if (this.transport && this.eventId !== undefined) {
      this.transport.clear(this.eventId);
    }
  }

  public abstract copy(): Element;
  protected abstract add(transport: Transport): string;
}

@io.inheritSerialization(Element)
export class PlacedPattern extends Element {
  public static create(pattern: Pattern) {
    const element = new PlacedPattern();
    element.duration = pattern.duration;
    element.patternId = pattern.id;
    element.pattern = pattern;
    return element;
  }

  public readonly component = 'pattern-element';

  public pattern!: Pattern;
  @io.auto public patternId!: string;

  public init(pattern: Pattern) {
    this.pattern = pattern;
  }

  public copy() {
    const pp = new PlacedPattern();
    Object.assign(pp, this);
    return pp;
  }

  protected add(transport: Transport) {
    return transport.embed(this.pattern.transport, this.tickTime, toTickTime(this._duration));
  }
}

export class Sample {
  public static create(samplePath: string, buffer: AudioBuffer) {
    const sample = new Sample();
    sample.path = samplePath;
    sample.init(buffer);
    return sample;
  }

  @io.auto public id = uuid.v4();
  @io.auto public path!: string;
  public buffer: AudioBuffer | null = null;
  private player: Tone.Player | null = null;

  get beats() {
    if (this.buffer) {
      const minutes = this.buffer.length / this.buffer.sampleRate / 60;
      return minutes * Tone.Transport.bpm.value;
    } else {
      return 0;
    }
  }

  get name() {
    return pth.basename(this.path);
  }

  public init(buffer: AudioBuffer | null) {
    this.buffer = buffer;

    if (buffer) {
      this.player = new Tone.Player(buffer).toMaster();
    }
  }

  public start(exact?: number, ticks?: string) {
    if (this.player) {
      this.player.start(exact, undefined, ticks);
    }
  }

  public stop() {
    if (this.player) {
      this.player.stop();
    }
  }

  public dispose() {
    if (this.player) {
      disposeHelp(this.player);
    }
  }
}

@io.inheritSerialization(Element)
export class PlacedSample extends Element {
  public static create(sample: Sample) {
    const element = new PlacedSample();
    element.sampleId = sample.id;
    element.duration = sample.beats;
    element.init(sample);
    return element;
  }

  @io.auto public sampleId!: string;
  public readonly component = 'sample-element';
  public sample!: Sample;

  get beats() {
    return this.sample.beats;
  }

  public copy() {
    const pp = new PlacedSample();
    Object.assign(pp, this);
    return pp;
  }

  public init(sample: Sample) {
    this.sample = sample;
  }

  public add(transport: Transport) {
    return transport.schedule((exact: number) => {
      const duration = toTickTime(this.duration);
      this.sample.start(exact, duration);
    }, this.tickTime);
  }
}

@io.inheritSerialization(Element)
export class Note extends Element {
  public static create(instrument: Instrument) {
    const element = new Note();
    element.instrument = instrument;
    return element;
  }
  public readonly component = 'note';
  public instrument!: Instrument;

  public init(instrument: Instrument) {
    this.instrument = instrument;
    return this;
  }

  public copy() {
    const pp = new Note();
    Object.assign(pp, this);
    return pp;
  }

  public add(transport: Transport) {
    return transport.schedule((exact: number) => {
      this.instrument.callback(exact, this);
    }, this.tickTime);
  }
}

@io.inheritSerialization(Element)
export class PlacedAutomationClip extends Element {
  public static create(clip: AutomationClip, time: number, row: number, duration: number) {
    const element = new PlacedAutomationClip();
    element.clip = clip;
    element.time = time;
    element.row = row;
    element.automationId = clip.id;
    element.duration = duration;
    return element;
  }

  public readonly component = 'automation-clip-element';
  @io.auto public automationId!: string;
  public clip!: AutomationClip;

  public init(clip: AutomationClip) {
    this.clip = clip;
    return this;
  }

  public copy() {
    const pp = new PlacedAutomationClip();
    Object.assign(pp, this);
    return pp;
  }

  protected add(transport: Transport) {
    return this.clip.control.sync(transport, this.tickTime, toTickTime(this.duration));
  }
}

export class Score {
  public static create(instrument: Instrument) {
    const score = new Score();
    score.instrument = instrument;
    score.instrumentId = instrument.id;
    score.id = uuid.v4();
    return score;
  }
  public instrument!: Instrument;
  @io.auto public id!: string;
  @io.auto public instrumentId!: string;
  @io.auto({ type: Note }) public notes: Note[] = [];

  public init(instrument: Instrument) {
    this.instrument = instrument;
  }

  public dispose() {
    this.notes.forEach((note) => note.dispose());
  }
}

export class Pattern {
  public static create(name: string) {
    const pattern = new Pattern();
    pattern.name = name;
    return pattern;
  }
  @io.auto public id: string = uuid.v4();
  @io.auto public name!: string;
  @io.auto({ type: Score }) public scores: Score[] = [];
  public transport = new Transport();

  get duration() {
    // TODO 4 is is hardcoded
    return this.scores.reduce((max, score) => {
      return Math.max(max, ...score.notes.map(({ time, duration }) => time + duration));
    }, 4);
  }

  public dispose() {
    this.scores.forEach((score) => score.dispose());
  }

  public removeScores(condition: (score: Score) => boolean) {
    const scores = this.scores.slice(0).reverse();
    scores.forEach((score, i) => {
      if (condition(score)) {
        score.dispose();
        this.scores.splice(i, 1);
      }
    });
  }
}

export interface IInstrument {
  name: string;
  pan: number;
  volume: number;
  type: string;
  mute: boolean;
}

export class Instrument {
  public static create(o: IInstrument) {
    const instrument = new Instrument();
    instrument.name = o.name;
    instrument.pan.value = o.pan;
    instrument.volume.value = o.volume;
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
  @io.auto public name!: string;
  @io.auto public id!: string;
  private destination: Tone.AudioNode | null = Tone.Master;
  // tslint:disable-next-line:variable-name
  private _type!: string;
  // tslint:disable-next-line:variable-name
  private _mute!: boolean;
  // tslint:disable-next-line:variable-name
  private _channel: number | null = null;
  // tslint:disable-next-line:member-ordering
  private panner = new Tone.Panner().toMaster();
  private connected = true;
  private synth = new Tone.PolySynth(8, Tone.Synth).connect(this.panner);

  // tslint:disable-next-line:member-ordering
  @io.attr('value')
  public volume = new Signal(this.synth.volume);

  // tslint:disable-next-line:member-ordering
  @io.attr('value')
  public pan = new Signal(this.panner.pan);

  constructor() {
    this.synth.set({ envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 } });
  }

  get mute() {
    return this._mute;
  }
  @io.auto
  set mute(mute: boolean) {
    this._mute = mute;
    this.checkConnection();
  }

  @io.auto({ nullable: true, optional: true })
  get channel() {
    return this._channel;
  }
  set channel(channel: number | null) {
    this._channel = channel;
  }

  get type() {
    return this._type;
  }
  @io.auto
  set type(type: string) {
    this._type = type;
    this.synth.set({ oscillator: { type } });
  }

  public triggerAttackRelease(note: string, duration: Time, time: number) {
    this.synth.triggerAttackRelease(note, duration, time);
  }

  public triggerRelease(note: string) {
    this.synth.triggerRelease(note);
  }

  public triggerAttack(note: string) {
    this.synth.triggerAttack(note);
  }

  public connect(effect: AnyEffect | Tone.AudioNode) {
    if (effect instanceof Effect) {
      this.panner.connect(effect.effect);
      this.destination = effect.effect;
    } else {
      this.panner.connect(effect);
      this.destination = effect;
    }
    this.checkConnection();
  }

  public disconnect() {
    if (this.destination) {
      this.panner.disconnect(this.destination);
      this.destination = null;
    }
  }

  public callback(time: number, note: Note) {
    const duration = toTickTime(note.duration);
    const value = allKeys[note.row].value;
    this.triggerAttackRelease(value, duration, time);
  }

  public dispose() {
    this.disconnect();
    // For some reason, this causes internal issues in Tone.js
    // disposeHelp(this.synth);
    disposeHelp(this.panner);
    disposeHelp(this.volume);
    disposeHelp(this.pan);
  }

  private checkConnection() {
    if (!this.destination) { return; }
    if (this.mute && this.connected) {
      this.panner.disconnect(this.destination);
      this.connected = false;
    } else if (!this.mute && !this.connected) {
      this.panner.connect(this.destination);
      this.connected = true;
    }
  }
}

export class Point {
  public static create(time: Beats, value: number) {
    const point = new Point();
    point.time = time;
    point.value = value;
    return point;
  }

  @io.auto public time!: Beats;
  @io.auto public value!: number;
  public eventId!: string;

  public init(eventId: string) {
    this.eventId = eventId;
  }
}

export type ClipContext = 'channel' | 'instrument';
export type Automatable = Channel | Instrument;

export class AutomationClip {
  public static create(length: number, signal: Signal, context: ClipContext, id: string) {
    const ac = new AutomationClip();
    ac.init(signal);
    ac.context = context;
    ac.contextId = id;

    ac.add(0, signal.value);
    ac.add(length, signal.value);

    return ac;
  }

  @io.autoserializeAs(Point) public points: Point[] = [];
  @io.auto public context!: ClipContext;
  @io.auto public contextId!: string;
  @io.auto public attr!: string;
  @io.auto public id = uuid.v4();

  public signal!: Signal;
  public control!: Controller;

  public init(signal: Signal) {
    if (!(signal instanceof Signal)) {
      throw Error(`${signal} not instanceof Signal`);
    }

    this.signal = signal;
    this.control = new Controller(signal);
    this.points.forEach(this.schedule);
  }

  public change(index: number, value: number) {
    const point = this.points[index];
    this.control.change(point.eventId, value);
    this.points[index].value = value;
  }

  public remove(i: number) {
    const point = this.points[i];
    this.control.remove(point.eventId);
    this.points.splice(i, 1);
  }

  public add(time: number, value: number) {
    const point = Point.create(time, value);
    this.schedule(point);
    this.points.push(point);
  }

  private schedule(point: Point) {
    const eventId = this.control.add(toTickTime(point.time), point.value);
    point.init(eventId);
  }
}

export type EffectName = keyof EffectOptions;

export const EffectMap = {
  wah: Tone.AutoWah,
  reverb: Tone.Freeverb,
  phaser: Tone.Phaser,
  bitCrusher: Tone.BitCrusher,
  pingPongDelay: Tone.PingPongDelay,
  compressor: Tone.Compressor,
  EQ3: Tone.EQ3,
  limiter: Tone.Phaser,
  chorus: Tone.Chorus,
  tremolo: Tone.Tremolo,
  distortion: Tone.Distortion,
};

export interface Constraints {
  min: number;
  max: number;
}

interface PhaserOptions {
  frequency: number;
  octaves: number;
  baseFrequency: number;
  Q: number;
}

interface ReverbOptions {
  decay: number;
  preDelay: number;
}

interface WahOptions {
  baseFrequency: number;
  sensitivity: number;
  octaves: number;
}

interface BitCrusherOptions {
  bits: number;
}

interface PingPongDelayOptions {
  delayTime: number;
  feedback: number;
}

interface CompressorOptions {
  ratio: number;
  threshold: number;
  release: number;
  attack: number;
  knee: number;
}

interface EQ3Options {
  low: number;
  mid: number;
  high: number;
  lowFrequency: number;
  highFrequency: number;
}

interface LimiterOptions {
  threshold: number;
}

interface ChorusOptions {
  frequency: number;
  delayTime: number;
  depth: number;
}

interface TremoloOptions {
  frequency: number;
  depth: number;
}

interface DistortionOptions {
  depth: number;
}

export interface EffectTones {
  wah: Tone.AutoWah;
  reverb: Tone.Freeverb;
  phaser: Tone.Phaser;
  bitCrusher: Tone.BitCrusher;
  pingPongDelay: Tone.PingPongDelay;
  compressor: Tone.Compressor;
  EQ3: Tone.EQ3;
  limiter: Tone.Limiter;
  chorus: Tone.Chorus;
  tremolo: Tone.Tremolo;
  distortion: Tone.Distortion;
}

export interface EffectOptions {
  wah: WahOptions;
  reverb: ReverbOptions;
  phaser: PhaserOptions;
  bitCrusher: BitCrusherOptions;
  pingPongDelay: PingPongDelayOptions;
  compressor: CompressorOptions;
  EQ3: EQ3Options;
  limiter: LimiterOptions;
  chorus: ChorusOptions;
  tremolo: TremoloOptions;
  distortion: DistortionOptions;
}

export type EffectConstrainsType = { [K in keyof EffectOptions]: { [E in keyof EffectOptions[K]]: Constraints } };

export const EffectConstrains: EffectConstrainsType = {
  wah: {
    baseFrequency: {
      min: 0,
      max: 1000,
    },
    octaves: {
      min: 0,
      max: 10,
    },
    sensitivity: {
      min: -40,
      max: 0,
    },
  },
  reverb: {
    decay: {
      min: 0,
      max: 24,
    },
    preDelay: {
      min: 0,
      max: 24,
    },
  },
  phaser: {
    frequency: {
      min: 0,
      max: 10,
    },
    octaves: {
      min: 0,
      max: 10,
    },
    Q: {
      min: 0,
      max: 100,
    },
    baseFrequency: {
      min: 0,
      max: 1000,
    },
  },
  bitCrusher: {
    bits: {
      min: 0,
      max: 10,
    },
  },
  pingPongDelay: {
    delayTime: {
      min: 0,
      max: 10,
    },
    feedback: {
      min: 0,
      max: 0,
    },
  },
  compressor: {
    ratio: {
      min: 0,
      max: 20,
    },
    threshold: {
      min: -40,
      max: 0,
    },
    release: {
      min: 0,
      max: 1,
    },
    attack: {
      min: 0,
      max: 1,
    },
    knee: {
      min: 0,
      max: 50,
    },
  },
  EQ3: {
    low: {
      min: -10,
      max: 10,
    },
    mid: {
      min: -10,
      max: 10,
    },
    high: {
      min: -10,
      max: 10,
    },
    lowFrequency: {
      min: 200,
      max: 1000,
    },
    highFrequency: {
      min: 2000,
      max: 8000,
    },
  },
  limiter: {
    threshold: {
      min: -10,
      max: 2,
    },
  },
  chorus: {
    frequency: {
      min: 0,
      max: 0,
    },
    delayTime: {
      min: 0,
      max: 0,
    },
    depth: {
      min: 0,
      max: 0,
    },
  },
  tremolo: {
    frequency: {
      min: 0,
      max: 20,
    },
    depth: {
      min: 0,
      max: 1,
    },
  },
  distortion: {
    depth: {
      min: 0,
      max: 1,
    },
  },
};

const EffectDefaults: EffectOptions = {
  wah: {
    octaves: 3,
    baseFrequency: 350,
    sensitivity: 0,
  },
  reverb: {
    decay: 1.5,
    preDelay: 0.01,
  },
  phaser: {
    frequency: 0.5,
    octaves: 3,
    Q: 10,
    baseFrequency: 350,
  },
  bitCrusher: {
    bits: 4,
  },
  pingPongDelay: {
    delayTime: 0.25,
    feedback: 1,
  },
  compressor: {
    ratio: 1,
    threshold: -2,
    release: 0.2,
    attack: 0.00,
    knee: 30,
  },
  EQ3: {
    low: 0,
    mid: 0,
    high: 0,
    lowFrequency: 400,
    highFrequency: 2500,
  },
  limiter: {
    threshold: -12,
  },
  chorus: {
    frequency: 1.5,
    delayTime: 3.5,
    depth: 0.7,
  },
  tremolo: {
    depth: 0.5,
    frequency: 10,
  },
  distortion: {
    depth: 0.4,
  },
};

export class Effect<T extends EffectName> {
  public static create<E extends EffectName>(slot: number, type: E) {
    const effect = new Effect<E>();
    effect.type = type;
    effect.slot = slot;
    effect.options = EffectDefaults[type];
    effect.init();
    return effect;
  }

  @io.auto public slot!: number; // 0 <= slot < maxSlots
  @io.auto public type!: T;
  @io.auto public options!: EffectOptions[T];
  @io.auto public id = uuid.v4();

  public effect!: EffectTones[T];
  private destination: Tone.AudioNode | null = null;

  public init() {
    this.effect = new EffectMap[this.type]();
  }

  public connect(effect: AnyEffect | Tone.AudioNode) {
    if (effect instanceof Effect) {
      this.effect.connect(effect.effect);
      this.destination = effect.effect;
    } else {
      this.effect.connect(effect);
      this.destination = effect;
    }
  }

  public disconnect() {
    if (this.destination) {
      this.effect.disconnect(this.destination);
      this.destination = null;
    }
  }
}

export class AnyEffect extends Effect<EffectName> {}

export class Channel {
  public static create(num: number) {
    const channel = new Channel();
    channel.number = num;
    channel.name = `Channel ${num}`;
    return channel;
  }

  @io.auto public number!: number;
  @io.auto public name!: string;
  @io.auto({ type: Effect, optional: true }) public effects: AnyEffect[] = [];
  @io.auto public id = uuid.v4();

  public left = new Tone.Meter();
  public right = new Tone.Meter();
  public split = new Tone.Split();

  private pannerNode = new Tone.Panner().toMaster().connect(this.split);
  // tslint:disable-next-line:member-ordering
  @io.attr('value')
  public panner = new Signal(this.pannerNode.pan);

  private gainNode = new Tone.Gain().connect(this.pannerNode);
  // tslint:disable-next-line:member-ordering
  @io.attr('value')
  public volume = new Signal(this.gainNode.gain);

  // tslint:disable-next-line:member-ordering
  public destination = this.gainNode;
  private connected = true;
  private muted = false;

  constructor() {
    // DEFAULTs
    this.volume.value = 0.7;
    this.split.left.connect(this.left);
    this.split.right.connect(this.right);
  }

  @io.auto
  get mute() {
    return this.muted;
  }

  set mute(mute: boolean) {
    this.muted = mute;
    if (mute && this.connected) {
      this.pannerNode.disconnect(Tone.Master);
      this.connected = false;
    } else if (!mute && !this.connected) {
      this.pannerNode.connect(Tone.Master);
      this.connected = true;
    }
  }

  public init() {
    const effects = this.effects;
    effects.forEach(
      (effect) => effect.init());

    if (effects.length === 0) {
      return;
    }

    for (const [i, effect] of effects.slice(1).entries()) {
      effects[i - 1].connect(effect);
    }

    effects[effects.length - 1].connect(this.destination);
  }
}


export class Track {
  public static create(i: number) {
    const track = new Track();
    track.name = `Track ${i}`;
    return track;
  }
  @io.auto public name!: string;
  @io.auto public mute = false;
}

type PlaylistElements = PlacedPattern | PlacedSample | PlacedAutomationClip;
export class Playlist {
  @io.auto({ types: [PlacedPattern, PlacedSample], optional: true })
  public elements: PlaylistElements[] = [];

  public transport = new Transport();

  public init() {
    this.elements.forEach((element) => {
      element.schedule(this.transport);
    });
  }
}
