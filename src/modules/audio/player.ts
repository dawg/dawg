import Tone from 'tone';
import { Source } from './source';
import { Time } from './types';

export class Player extends Source {
  public fadeOut = 0;
  private activeSources: Tone.BufferSource[] = [];

  constructor(public buffer: AudioBuffer) {
    super();
  }

  public _start(startTime?: Time, offset?: Time, duration?: Time) {
    offset = offset || 0;

    offset = this.toSeconds(offset);

    let computedDuration = duration === undefined ? Math.max(this.buffer.duration - offset, 0) : duration;
    computedDuration = this.toSeconds(computedDuration);

    // scale it by the playback rate
    // computedDuration = computedDuration / this._playbackRate;

    // get the start time
    startTime = this.toSeconds(startTime);

    // make the source
    const source = new Tone.BufferSource({
      buffer: this.buffer,
      onended: this.onSourceEnded.bind(this),
      fadeOut: this.fadeOut,
      // playbackRate: this.playbackRate,
    }).connect(this.output);

    // if it's not looping, set the state change at the end of the sample
    this._state.setStateAtTime('stopped', startTime + computedDuration);

    // add it to the array of active sources
    this.activeSources.push(source);

    // start it
    if (duration === undefined) {
      source.start(startTime, offset);
    } else {
      // subtract the fade out time
      source.start(startTime, offset, computedDuration - this.toSeconds(this.fadeOut));
    }
    return this;
  }

  public restart(startTime?: Time, offset?: Time, duration?: Time) {
    this._stop(startTime);
    this._start(startTime, offset, duration);
    return this;
  }

  public _stop(time?: Time) {
    time = this.toSeconds(time);
    this.activeSources.forEach((source) => {
      source.stop(time);
    });
    return this;
  }

  private onSourceEnded(source: Tone.BufferSource) {
    const index = this.activeSources.indexOf(source);
    this.activeSources.splice(index, 1);
    if (this.activeSources.length === 0 && !this.synced) {
      this._state.setStateAtTime('stopped', Tone.Transport.context.now());
    }
  }
}
