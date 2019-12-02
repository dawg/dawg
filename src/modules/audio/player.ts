import Tone from 'tone';
import { Source } from '@/modules/audio/source';
import { Ticks, ContextTime } from '@/modules/audio/types';
import { Context, context } from '@/modules/audio/context';

export class Player extends Source {
  constructor(public buffer: AudioBuffer) {
    super();
  }

  public start(startTime: Ticks, offset: Ticks, duration: Ticks) {
    offset = Context.ticksToSeconds(offset);
    duration = Context.ticksToSeconds(duration);
    startTime = Context.ticksToSeconds(startTime);

    const source = this.createSource();

    source.start(startTime, offset, duration);
    return {
      stop: (seconds: ContextTime) => {
        source.stop(seconds);
      },
    };
  }

  public preview() {
    const source = this.createSource();
    source.start();
    return source;
  }

  private createSource() {
     // make the source
     return new Tone.BufferSource({
      buffer: this.buffer,
      fadeOut: 0,
      // playbackRate: this.playbackRate,
    }).connect(this.output);
  }
}
