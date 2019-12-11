import Tone from 'tone';
import { Source } from '@/modules/audio/source';
import { ContextTime, Seconds } from '@/modules/audio/types';

export class Player extends Source {
  constructor(public buffer: AudioBuffer) {
    super();
  }

  public start(o: { startTime: Seconds, offset: Seconds, duration: Seconds }) {
    const { offset, duration, startTime } = o;
    const source = this.createSource();

    source.start(startTime, offset, duration);
    return {
      stop: (seconds: ContextTime) => {
        source.stop(seconds);
      },
    };
  }

  public preview(o?: { onended?: () => void }) {
    const source = this.createSource(o);
    source.start();
    return source;
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
