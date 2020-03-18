import { ContextTime, Seconds } from '@/lib/audio/types';
import { getContext } from '@/lib/audio/global';

export interface SourceOptions {
  onEnded: () => AudioScheduledSourceNode['onended'];
}

// TODO??????
export const augmentSource = <T extends AudioScheduledSourceNode>(node: T, options?: Partial<SourceOptions>) => {
  const context = getContext();
  const savedStart = node.start.bind(node);
  const savedStop = node.stop.bind(node);

  if (options?.onEnded) {
    node.onended = options.onEnded;
  }

  /**
   * Start the source at the specified time. If no time is given,
   * start the source now.
   * @param  time When the source should be started.
   */
  const start = (o: { time?: ContextTime, offset?: Seconds, duration?: Seconds }) => {
    const computedTime = Math.max(o.time ?? context.now(), context.currentTime.value);
    const startTime = computedTime + (o.offset ?? 0);
    savedStart(startTime);

    if (o.duration !== undefined) {
      savedStop(startTime + o.duration);
    }
  };

  /**
   * Stop the source at the specified time. If no time is given,
   * stop the source now.
   * @param time When the source should be stopped.
   */
  const stop = (time?: ContextTime) => {
    const computedTime = Math.max(time ?? context.now(), context.currentTime.value);
    savedStop(computedTime);
  };

  return Object.assign(node, { start, stop });
};
