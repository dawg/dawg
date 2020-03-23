import { ContextTime, Ticks, Seconds, Hertz } from '@/lib/audio/types';
import { literal, Disposer } from '@/lib/std';
import { createTickSignal, ObeoTickSignal, ObeoTickSignalOptions } from '@/lib/audio/tick-signal';
import { createTimeline } from '@/lib/audio/timeline';
import { createStateTimeline, PlaybackState } from '@/lib/audio/state-timeline';
import { getContext } from '@/lib/audio/global';
import { Getter, getter } from '@/lib/reactor';

export interface ObeoTickSource extends Disposer {
  frequency: ObeoTickSignal;
  ticks: Getter<Ticks>;
  getSecondsAtTime(time?: ContextTime): Seconds;
  setTicksAtTime(ticks: Ticks, time?: ContextTime): void;
  getTicksAtTime(time?: ContextTime): Ticks;
  /**
   * Get the time of the given tick. The second argument
   * is when to test before. Since ticks can be set (with setTicksAtTime)
   * there may be multiple times for a given tick value.
   * @param  tick The tick number.
   * @param  before When to measure the tick value from.
   * @return The time of the tick
   */
  getTimeOfTick(tick: Ticks, before?: ContextTime): Seconds;
  start(time: ContextTime): ObeoTickSource;
  stop(time: ContextTime): ObeoTickSource;
  pause(time: ContextTime): ObeoTickSource;
  /**
   * Cancel start/stop/pause and setTickAtTime events scheduled after the given time.
   * @param time When to clear the events after
   */
  cancel(time: ContextTime): ObeoTickSource;
  forEachTickBetween(
    startTime: ContextTime,
    endTime: ContextTime,
    callback: (time: ContextTime, ticks: Ticks) => void,
  ): void;
  getStateAtTime(time: ContextTime): PlaybackState;
}

export type ObeoTickSourceOptions = Omit<ObeoTickSignalOptions, 'value'> & { frequency: Hertz };

export const createTickSource = (options?: Partial<ObeoTickSourceOptions>): ObeoTickSource => {
  const context = getContext();

  const frequency = createTickSignal({
    value: options?.frequency,
    toUnit: options?.toUnit,
    fromUnit: options?.fromUnit,
    name: options?.name,
  });

  /**
   * Record the state of the timeline. Although stop resets the ticks, need this because we can
   * start/pause multiple times.
   */
  const state = createStateTimeline({ initial: 'stopped' });

  /**
   * Tracks explicit sets of the ticks. For example, if the user uses the timeline to set, we use this
   * to record that action!
   */
  const tickOffset = createTimeline<{ time: number, ticks: number, seconds: number, offset: 0 }>();

  const getSecondsAtTime = (time?: ContextTime) => {
    time = time ?? context.now();
    const stopEvent = state.getLastState('stopped', time) ?? { time: 0, state: 'stopped' };

    // this event allows forEachBetween to iterate until the current time
    const tmpEvent = { state: literal('paused'), time };
    state.add(tmpEvent);

    // keep track of the previous offset event
    let lastState = stopEvent;
    let elapsedSeconds = 0;

    // TODO duplicate code

    // iterate through all the events since the last stop
    state.forEachBetween(stopEvent.time, time + context.sampleTime, (e) => {
      let periodStartTime = lastState.time;
      // if there is an offset event in this period use that
      const offsetEvent = tickOffset.get(e.time);
      if (offsetEvent && offsetEvent.time >= lastState.time) {
        elapsedSeconds = offsetEvent.seconds;
        periodStartTime = offsetEvent.time;
      }

      if (lastState.state === 'started' && e.state !== 'started') {
        elapsedSeconds += e.time - periodStartTime;
      }
      lastState = e;
    });

    // remove the temporary event
    state.remove(tmpEvent);

    // return the ticks
    return elapsedSeconds;
  };

  const setTicksAtTime = (ticks: Ticks, time?: ContextTime) => {
    time = time ?? context.now();
    tickOffset.cancel(time);
    tickOffset.add({
      time,
      ticks,
      seconds : frequency.offset.getDurationOfTicks(ticks, time),
      offset: 0,
    });
  };

  const getTicksAtTime = (time?: ContextTime) => {
    time = time ?? context.now();

    const stopEvent = state.getLastState('stopped', time) ?? { time: 0, state: 'stopped' };

    // this event allows forEachBetween to iterate until the current time
    const tmpEvent = { state: 'paused', time } as const;
    state.add(tmpEvent);

    // keep track of the previous offset event
    let lastState = stopEvent;
    let elapsedTicks = 0;

    // iterate through all the events since the last stop
    state.forEachBetween(stopEvent.time, time + context.sampleTime, (e) => {
      let periodStartTime = lastState.time;
      // if there is an offset event in this period use that
      const offsetEvent = tickOffset.get(e.time);

      if (offsetEvent && offsetEvent.time >= lastState.time) {
        elapsedTicks = offsetEvent.ticks;
        periodStartTime = offsetEvent.time;
      }

      if (lastState.state === 'started' && e.state !== 'started') {
        elapsedTicks +=
          frequency.offset.getTicksAtTime(e.time) -
          frequency.offset.getTicksAtTime(periodStartTime);
      }

      lastState = e;
    });

    // remove the temporary event
    state.remove(tmpEvent);

    // return the ticks
    return elapsedTicks;
  };

  const start = (time: ContextTime) => {
    if (state.getValueAtTime(time) !== 'started') {
      state.setStateAtTime('started', time);
    }
    return tickSource;
  };

  const stop = (time: ContextTime) => {
    // cancel the previous stop
    if (state.getValueAtTime(time) === 'stopped') {
      const event = state.get(time);
      if (event && event.time > 0) {
        tickOffset.cancel(event.time);
        state.cancel(event.time);
      }
    }
    state.cancel(time);
    state.setStateAtTime('stopped', time);
    setTicksAtTime(0, time);
    return tickSource;
  };

  const pause = (time: ContextTime): ObeoTickSource => {
    if (state.getValueAtTime(time) === 'started') {
      state.setStateAtTime('paused', time);
    }
    return tickSource;
  };

  const cancel = (time: ContextTime): ObeoTickSource => {
    state.cancel(time);
    tickOffset.cancel(time);
    return tickSource;
  };

  const forEachTickBetween = (
    startTime: ContextTime,
    endTime: ContextTime,
    callback: (time: ContextTime, ticks: Ticks,
  ) => void) => {
    // only iterate through the sections where it is "started"
    let lastStateEvent = state.get(startTime);
    state.forEachBetween(startTime, endTime, (event) => {
      if (lastStateEvent && lastStateEvent.state === 'started' && event.state !== 'started') {
        forEachTickBetween(Math.max(lastStateEvent.time, startTime), event.time - context.sampleTime, callback);
      }
      lastStateEvent = event;
    });

    let error: Error | null = null;

    if (lastStateEvent && lastStateEvent.state === 'started') {
      const maxStartTime = Math.max(lastStateEvent.time, startTime);
      // figure out the difference between the frequency ticks and the
      const startTicks = frequency.offset.getTicksAtTime(maxStartTime);
      const ticksAtStart = frequency.offset.getTicksAtTime(lastStateEvent.time);
      const diff = startTicks - ticksAtStart;
      const offset = Math.ceil(diff) - diff;
      let nextTickTime = frequency.offset.getTimeOfTick(startTicks + offset);
      while (nextTickTime < endTime) {
        try {
          callback(nextTickTime, Math.round(getTicksAtTime(nextTickTime)));
        } catch (e) {
          error = e;
          break;
        }
        nextTickTime += frequency.offset.getDurationOfTicks(1, nextTickTime);
      }
    }

    if (error) {
      throw error;
    }
  };

  const getStateAtTime: ObeoTickSource['getStateAtTime'] = (time) => {
    return state.getValueAtTime(time);
  };

  const getTimeOfTick = (tick: Ticks, before?: ContextTime): Seconds => {
    before = before ?? context.now();
    const offset = tickOffset.get(before);
    if (!offset) {
      return 0;
    }

    const event = state.get(before);
    if (!event) {
      return 0;
    }

    const startTime = Math.max(offset.time, event.time);
    const absoluteTicks = frequency.offset.getTicksAtTime(startTime) + tick - offset.ticks;
    return frequency.offset.getTimeOfTick(absoluteTicks);
  };

  const dispose = () => {
    state.dispose();
    tickOffset.dispose();
    frequency.dispose();
  };

  // Just doing the initializations down at the bottom
  state.setStateAtTime('stopped', 0);
  // add the first event
  setTicksAtTime(0, 0);

  const tickSource: ObeoTickSource = {
    frequency,
    getSecondsAtTime,
    setTicksAtTime,
    getTicksAtTime,
    start,
    stop,
    pause,
    cancel,
    forEachTickBetween,
    getTimeOfTick,
    getStateAtTime,
    dispose,
    ticks: getter(() => getTicksAtTime(context.now())),
  };

  return tickSource;
};

