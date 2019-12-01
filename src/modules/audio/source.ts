import Tone from 'tone';
import { Ticks } from '@/modules/audio/types';

export abstract class Source extends Tone.AudioNode {
  public volume: Tone.Signal;
  protected output: Tone.AudioNode;
  // tslint:disable-next-line:variable-name
  private _volume: Tone.Volume;

  constructor(options: { volume?: number, mute?: boolean } = {}) {
    super();

    this._volume = this.output = new Tone.Volume(options.volume || 0);


    this.volume = this._volume.volume;

    (this._volume as any).output.output.channelCount = 2;
    (this._volume as any).output.output.channelCountMode = 'explicit';

    this.mute = options.mute || false;
  }

  get mute() {
    return this._volume.mute;
  }

  set mute(mute: boolean) {
    this._volume.mute = mute;
  }

  public abstract start(startTime: Ticks, offset: Ticks, duration: Ticks): void;
  public abstract stop(time: Ticks): void;
}
