import Tone from 'tone';
import { ContextTime, Ticks, Seconds } from '@/lib/audio/types';
import { context } from '@/lib/audio/online';
import { literal } from '@/lib/std';
import { createTickSignal, ObeoTickSignal } from '@/lib/audio/tick-signal';
import { createTimeline } from '@/lib/audio/timeline';

export interface ObeoTickSource {
  frequency: ObeoTickSignal;
  getSecondsAtTime(time?: ContextTime): Seconds;
  setTicksAtTime(ticks: Ticks, time?: ContextTime): void;
  getTicksAtTime(time?: ContextTime): Ticks;
  start(time: ContextTime): void;
  stop(time: ContextTime): void;
  pause(time: ContextTime): void;
  forEachTickBetween(
    startTime: ContextTime,
    endTime: ContextTime,
    callback: (time: ContextTime, ticks: Ticks) => void,
  ): void;
}

export interface TickSourceOptions {
  frequency: number;
}

export const createTickSource = (options?: Partial<TickSourceOptions>): ObeoTickSource => {
  const frequency = createTickSignal({
    value: options?.frequency,
  });

  /**
   * Record the state of the timeline. Although stop resets the ticks, need this because we can
   * start/pause multiple times.
   */
  const state = new Tone.TimelineState('stopped');

  /**
   * Tracks explicit sets of the ticks. For example, if the user uses the timeline to set, we use this
   * to record that action!
   */
  const tickOffset = createTimeline<{ time: number, ticks: number, seconds: number, offset: 0 }>();

  const getSecondsAtTime = (time?: ContextTime) => {
    time = time ?? context.now();
    const stopEvent = state.getLastState('stopped', time);
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
    const stopEvent = state.getLastState('stopped', time);
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
  };

  const stop = (time: ContextTime) => {
    // cancel the previous stop
    if (state.getValueAtTime(time) === 'stopped') {
      const event = state.get(time);
      if (event.time > 0) {
        tickOffset.cancel(event.time);
        state.cancel(event.time);
      }
    }
    state.cancel(time);
    state.setStateAtTime('stopped', time);
    setTicksAtTime(0, time);
  };

  const pause = (time: ContextTime) => {
    if (state.getValueAtTime(time) === 'started') {
      state.setStateAtTime('paused', time);
    }
  };

  const forEachTickBetween = (
    startTime: ContextTime, endTime: ContextTime, callback: (time: ContextTime, ticks: Ticks,
  ) => void) => {
    // only iterate through the sections where it is "started"
    let lastStateEvent = state.get(startTime);
    state.forEachBetween(startTime, endTime, (event) => {
      if (lastStateEvent.state === 'started' && event.state !== 'started') {
        forEachTickBetween(Math.max(lastStateEvent.time, startTime), event.time - context.sampleTime, callback);
      }
      lastStateEvent = event;
    });

    startTime = Math.max(lastStateEvent.time, startTime);

    let error = null;
    if (lastStateEvent.state === 'started' && state) {
      // figure out the difference between the frequency ticks and the
      const startTicks = frequency.offset.getTicksAtTime(startTime);
      const ticksAtStart = frequency.offset.getTicksAtTime(lastStateEvent.time);
      const diff = startTicks - ticksAtStart;
      let offset = diff % 1;
      if (offset !== 0) {
        offset = 1 - offset;
      }
      let nextTickTime = frequency.offset.getTimeOfTick(startTicks + offset);
      while (nextTickTime < endTime && state) {
        try {
          callback(nextTickTime, Math.round(getTicksAtTime(nextTickTime)));
        } catch (e) {
          error = e;
          break;
        }
        if (state) {
          nextTickTime += frequency.offset.getDurationOfTicks(1, nextTickTime);
        }
      }
    }

    if (error) {
      throw error;
    }
  };

  // Just doing the initializations down at the bottom
  state.setStateAtTime('stopped', 0);
  // add the first event
  setTicksAtTime(0, 0);

  return {
    frequency,
    getSecondsAtTime,
    setTicksAtTime,
    getTicksAtTime,
    start,
    stop,
    pause,
    forEachTickBetween,
  };
};

