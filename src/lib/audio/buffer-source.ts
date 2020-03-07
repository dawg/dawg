import { context, Context } from '@/lib/audio/context';
import { createGain } from '@/lib/audio/gain';
import { ContextTime, Seconds, Positive, GainFactor } from '@/lib/audio/types';
import { assert } from '@/lib/audio/util';

export interface ToneBufferSourceOptions {
  playbackRate: Positive;
  onEnded: () => void;
}

// return Object.assign(OneShotSource.getDefaults(), {
//   playbackRate: 1,
// });

export const createBufferSource = (buffer: AudioBuffer, options?: Partial<ToneBufferSourceOptions>) => {
  const source = context.createBufferSource();
  source.buffer = buffer;

  let sourceStarted = false;
  let sourceStopped = false;

  // TODO make it so you can't stop before starting

  /**
   * Start the buffer
   * @param  time When the player should start.
   * @param  offset The offset from the beginning of the sample to start at.
   * @param  duration How long the sample should play. If no duration is given, it will default to
   * the full length of the sample (minus any offset).
   */
  const start = (time?: ContextTime, offset?: Seconds, duration?: Seconds) => {
    const computedTime = time ?? Context.now();

    // otherwise the default offset is 0
    offset = offset ?? 0;

    // make sure the offset is not less than 0
    const computedOffset = Math.max(offset ?? 0, 0);

    if (computedOffset < buffer.duration) {
      sourceStarted = true;
      source.start(computedTime, computedOffset);
    }

    // if a duration is given, schedule a stop
    if (duration !== undefined) {
      // make sure it's never negative
      stop(computedTime + Math.max(duration, 0));
    }
  };

  /**
   * Stop the source node at the given time.
   * @param time When to stop the source
   */
  const stop = (time?: ContextTime) => {
    stopSource(time);
    onended();
  };

  const stopSource = (time?: Seconds) => {
    if (!sourceStopped && sourceStarted) {
      sourceStopped = true;
      // TODO refactor all + context.currentTime!!
      source.stop(time ?? Context.now());
      onended();
    }
  };

  const onended = () => {
    if (options?.onEnded) {
      options.onEnded();
    }

    // dispose when it's ended to free up for garbage collection only in the online context
    setTimeout(() => dispose(), 1000);
  };

  const dispose = () => {
    source.buffer = null;
    source.disconnect();
  };

  source.onended = () => stopSource();

  /**
   * The playbackRate of the buffer
   */
  // FIXME
  // this.playbackRate = new Param({
  //   context: this.context,
  //   param: source.playbackRate,
  //   units: 'positive',
  //   value: options.playbackRate,
  // });

  return Object.assign({ start, stop }, source);
};
