import Tone from 'tone';
import Audio, { Time } from '@/modules/audio';
import io from '@/modules/cerialize';
import uuid from 'uuid';
import { disposeHelp } from '@/utils';
import { AnyEffect, Effect } from '@/schemas';

export abstract class Source {
  @io.auto public name!: string;
  @io.auto public id = uuid.v4();

  @io.auto({ nullable: true, optional: true })
  public channel: number | null = null;

  protected source: Tone.Instrument;
  private destination: Tone.AudioNode | null = Tone.Master;
  private muted!: boolean;
  // tslint:disable-next-line:member-ordering
  private panner = new Tone.Panner().toMaster();
  private connected = true;

  // tslint:disable-next-line:member-ordering
  @io.attr('value')
  public volume = new Audio.Signal(this.source.volume);

  // tslint:disable-next-line:member-ordering
  @io.attr('value')
  public pan = new Audio.Signal(this.panner.pan);

  get mute() {
    return this.muted;
  }

  @io.auto
  set mute(mute: boolean) {
    this.muted = mute;
    this.checkConnection();
  }

  constructor(source: Tone.Instrument) {
    this.source = source.connect(this.panner);
  }

  public triggerAttackRelease(note: string, duration: Time, time: number, velocity?: number) {
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

  public init() {
    this.volume = new Audio.Signal(this.source.volume);
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
