import Tone from 'tone';
import * as Audio from '@/modules/audio';
import uuid from 'uuid';
import * as t from 'io-ts';
import { disposeHelp } from '@/utils';

export const InstrumentType = t.intersection([
  t.type({
    name: t.string,
  }),
  t.partial({
    channel: t.union([t.null, t.number]),
    id: t.string,
    pan: t.number,
    volume: t.number,
    mute: t.boolean,
  }),
]);

export type IInstrument = t.TypeOf<typeof InstrumentType>;

export abstract class Instrument<T, V extends string> {
  public name: string;
  public id: string;

  /**
   * A type variable. For example, oscillator or soundfont.
   */
  public abstract type: V;

  /**
   * All of the possible options.
   */
  public abstract types: V[];

  public channel: number | null;

  protected source: Audio.Source<T> | null;
  private destination: Tone.AudioNode | null = Tone.Master;
  private muted: boolean;
  // tslint:disable-next-line:member-ordering
  private panner = new Tone.Panner().toMaster();
  private connected = true;

  // tslint:disable-next-line:member-ordering
  public pan = new Audio.Signal(this.panner.pan);

  // TODO for the gain
  private gainNode = new Tone.Gain().connect(this.panner);

  // tslint:disable-next-line:member-ordering
  public volume = new Audio.Signal(this.gainNode.gain);

  constructor(source: Audio.Source<T> | null, destination: Tone.AudioNode, i: IInstrument) {
    this.source = source;
    if (source) {
      source.connect(this.gainNode);
    }

    this.name = i.name;
    this.id = i.id || uuid.v4();
    this.channel = i.channel === undefined ? null : i.channel;
    this.muted = !!i.mute;
    this.mute = !!i.mute; // TODO(jacob)
    this.pan.value = i.pan || 0;
    this.volume.value = i.volume === undefined ? 0.8 : i.volume;
    this.connect(destination);
  }

  get mute() {
    return this.muted;
  }

  set mute(mute: boolean) {
    this.muted = mute;
    this.checkConnection();
  }

  public triggerAttackRelease(note: string, duration: Audio.Time, time: number, velocity?: number) {
    if (this.source) {
      this.source.triggerAttackRelease(note, duration, time, velocity);
    }
  }

  public triggerRelease(note: string) {
    if (this.source) {
      this.source.triggerRelease(note);
    }
  }

  public triggerAttack(note: string) {
    if (this.source) {
      this.source.triggerAttack(note);
    }
  }

  public connect(effect: Tone.AudioNode) {
    this.panner.connect(effect);
    this.destination = effect;
    this.checkConnection();
  }

  public disconnect() {
    if (this.destination) {
      this.panner.disconnect(this.destination);
      this.destination = null;
    }
  }

  public set<K extends keyof T>(o: { key: K, value: T[K] }) {
    if (this.source) {
      this.source.set(o);
    }
  }

  public dispose() {
    this.disconnect();
    // disposeHelp(this.source);
    disposeHelp(this.volume);
    disposeHelp(this.pan);
  }

  /**
   * Called when online status is returned. This can be removed when soundfonts are loaded locally.
   */
  public online() {
    // By default, do nothing
  }

  protected setSource(source: Audio.Source<T> | null) {
    if (this.source) {
      this.source.disconnect(this.gainNode);
    }

    this.source = source;
    if (this.source) {
      this.source.connect(this.gainNode);
    }
  }

  private checkConnection() {
    if (!this.destination) {
      return;
    }

    if (this.mute && this.connected) {
      this.panner.disconnect(this.destination);
      this.connected = false;
    } else if (!this.mute && !this.connected) {
      this.panner.connect(this.destination);
      this.connected = true;
    }
  }
}
