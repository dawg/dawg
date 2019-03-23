import Tone from 'tone';
import * as Audio from '@/modules/audio';
import * as t from 'io-ts';
import { disposeHelp } from '@/utils';

export const InstrumentType = t.type({
  name: t.string,
  id: t.string,
  channel: t.union([t.null, t.number]),
  pan: t.number,
  volume: t.number,
  mute: t.boolean,
});

export type IInstrument = t.TypeOf<typeof InstrumentType>;

export abstract class Instrument<T> {
  public name: string;
  public id: string;

  public channel: number | null;

  protected source: Audio.Source<T>;
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

  constructor(source: Audio.Source<T>, i: IInstrument) {
    this.source = source.connect(this.gainNode);
    this.name = i.name;
    this.id = i.id;
    this.channel = i.channel;
    this.muted = i.mute;
    this.mute = i.mute; // TODO(jacob)
    this.pan.value = i.pan;
    this.volume.value = i.volume;
  }

  get mute() {
    return this.muted;
  }

  set mute(mute: boolean) {
    this.muted = mute;
    this.checkConnection();
  }

  public triggerAttackRelease(note: string, duration: Audio.Time, time: number, velocity?: number) {
    this.source.triggerAttackRelease(note, duration, time, velocity);
  }

  public triggerRelease(note: string) {
    this.source.triggerRelease(note);
  }

  public triggerAttack(note: string) {
    this.source.triggerAttack(note);
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
    this.source.set(o);
  }

  public dispose() {
    this.disconnect();
    // disposeHelp(this.source);
    disposeHelp(this.volume);
    disposeHelp(this.pan);
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
