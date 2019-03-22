import Tone from 'tone';
import * as Audio from '@/modules/audio';
import io from '@/modules/cerialize';
import uuid from 'uuid';
import { disposeHelp } from '@/utils';
import { AnyEffect, Effect } from '@/schemas';

export abstract class Instrument<T> {
  @io.auto public name!: string;
  @io.auto public id = uuid.v4();

  @io.auto({ nullable: true, optional: true })
  public channel: number | null = null;

  protected source: Audio.Source<T>;
  private destination: Tone.AudioNode | null = Tone.Master;
  private muted!: boolean;
  // tslint:disable-next-line:member-ordering
  private panner = new Tone.Panner().toMaster();
  private connected = true;

  // tslint:disable-next-line:member-ordering
  @io.attr('value')
  public pan = new Audio.Signal(this.panner.pan);

  // TODO for the gain
  private gainNode = new Tone.Gain().connect(this.panner);

  // tslint:disable-next-line:member-ordering
  @io.attr('value')
  public volume = new Audio.Signal(this.gainNode.gain);

  get mute() {
    return this.muted;
  }

  @io.auto
  set mute(mute: boolean) {
    this.muted = mute;
    this.checkConnection();
  }

  constructor(source: Audio.Source<T>) {
    this.source = source.connect(this.gainNode);
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
