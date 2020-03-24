import { ContextTime, Seconds, Positive } from '@/lib/audio/types';
import { getContext } from '@/lib/audio/global';
import { ObeoNode, extractAudioNode, mimicAudioNode } from '@/lib/audio/node';
import { createGain } from '@/lib/audio/gain';

export interface ObeoBufferSourceOptions {
  playbackRate: Positive;
  onended: () => void;
}

export interface ObeoBufferSource extends ObeoNode<AudioBufferSourceNode, undefined> {
  /**
   * Start the buffer
   * @param  time When the player should start.
   * @param  offset The offset from the beginning of the sample to start at.
   * @param  duration How long the sample should play. If no duration is given, it will default to
   * the full length of the sample (minus any offset).
   */
  start(time?: ContextTime, offset?: Seconds, duration?: Seconds): void;
  /**
   * Stop the source node at the given time.
   * @param time When to stop the source
   */
  stop(time?: ContextTime): void;
}

export const createBufferSource = (
  buffer: AudioBuffer | null,
  options?: Partial<ObeoBufferSourceOptions>,
): ObeoBufferSource => {
  const context = getContext();
  const source = context.createBufferSource();
  source.buffer = buffer;
  const bufferDuration = buffer?.duration ?? 0;

  let sourceStarted = false;
  let sourceStopped = false;

  // TODO make it so you can't stop before starting

  const start = (time?: ContextTime, offset?: Seconds, duration?: Seconds) => {
    const computedTime = time ?? context.now();

    // otherwise the default offset is 0
    offset = offset ?? 0;

    // make sure the offset is not less than 0
    const computedOffset = Math.max(offset ?? 0, 0);

    if (computedOffset < bufferDuration) {
      sourceStarted = true;
      source.start(computedTime, computedOffset);
    }

    // if a duration is given, schedule a stop
    if (duration !== undefined) {
      // make sure it's never negative
      stop(computedTime + Math.max(duration, 0));
    }
  };

  const stop = (time?: ContextTime) => {
    stopSource(time);
    onended();
  };

  const stopSource = (time?: Seconds) => {
    if (!sourceStopped && sourceStarted) {
      sourceStopped = true;
      source.stop(time ?? context.now());
      onended();
    }
  };

  const onended = () => {
    if (options?.onended) {
      options.onended();
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

  return {
    ...mimicAudioNode(undefined, source),
    start,
    stop,
  };
};
