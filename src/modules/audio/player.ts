import Tone from 'tone';
import { Source } from '@/modules/audio/source';
import { Ticks } from '@/modules/audio/types';
import { Context, context } from '@/modules/audio/context';

export class Player extends Source {
  private activeSources: Tone.BufferSource[] = [];

  constructor(public buffer: AudioBuffer) {
    super();
  }

  public start(startTime: Ticks, offset: Ticks, duration: Ticks) {
    offset = Context.ticksToSeconds(offset);
    duration = Context.ticksToSeconds(duration);
    startTime = Context.ticksToSeconds(startTime);

    const source = this.createSource();

    // add it to the array of active sources
    this.activeSources.push(source);

    source.start(startTime, offset, duration);
  }

  public stop(time?: Ticks) {
    // TODO uh I don't like this at all
    time = time === undefined ? Tone.Transport.context.now() : Context.ticksToSeconds(time);
    this.activeSources.forEach((source) => {
      source.stop(time);
    });
    return this;
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
      onended: this.onSourceEnded.bind(this),
      fadeOut: 0,
      // playbackRate: this.playbackRate,
    }).connect(this.output);
  }

  private onSourceEnded(source: Tone.BufferSource) {
    const index = this.activeSources.indexOf(source);
    this.activeSources.splice(index, 1);
  }
}
