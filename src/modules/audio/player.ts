import Tone from 'tone';
import { ContextTime, Seconds } from '@/modules/audio/types';
import { Context } from '@/modules/audio/context';

export class Player extends Tone.AudioNode {
  public volume: Tone.Signal;
  protected output: Tone.AudioNode;
  // tslint:disable-next-line:variable-name
  private _volume: Tone.Volume;

  constructor(public buffer: AudioBuffer, options: { volume?: number, mute?: boolean } = {}) {
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

  public preview(o?: { onended?: () => void }) {
    const source = this.createSource(o);
    source.start(Context.now(), 0);
    return source;
  }

  public createInstance() {
    return new PlayerInstance(this.createSource());
  }

  private createSource(o?: { onended?: () => void }) {
     // make the source
     return new Tone.BufferSource({
      buffer: this.buffer,
      fadeOut: 0,
      ...o,
      // playbackRate: this.playbackRate,
    }).connect(this.output);
  }
}


export class PlayerInstance {
  constructor(private source: Tone.BufferSource) {}

  public start(o: { startTime: Seconds, offset: Seconds, duration: Seconds }) {
    const { offset, duration, startTime } = o;

    this.source.start(startTime, offset, duration);
    return {
      stop: (seconds: ContextTime) => {
        this.source.stop(seconds);
      },
    };
  }
}
