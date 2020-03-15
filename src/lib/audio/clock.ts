import { onDidTick } from '@/lib/audio/ticker';
import { ContextTime, Ticks, Seconds } from '@/lib/audio/types';
import { createTickSource } from '@/lib/audio/tick-source';
import { emitter } from '@/lib/events';
import { context } from '@/lib/audio/online';
import { ObeoTickSignal } from '@/lib/audio/tick-signal';
import { PlaybackState } from '@/lib/audio/timeline-state';
import { Disposer } from '@/lib/std';

export interface ObeoClock {
  readonly frequency: ObeoTickSignal;
  getSeconds(): Seconds;
  getState(): PlaybackState;
  getTicks(): Ticks;
  setTicks(ticks: Ticks): void;
  start(): void;
  stop(): void;
  pause(): void;
  setTicksAtTime(ticks: Ticks, time: ContextTime): void;
  onDidStop(cb: (o: TimeTicks) => void): Disposer;
}

export type ClockCallback = (seconds: ContextTime, ticks: Ticks) => void;

export interface ObeoClockOptions {
  frequency: number;
}

interface TimeTicks {
  seconds: ContextTime;
  ticks: Ticks;
}

export const createClock = (callback: ClockCallback, options?: Partial<ObeoClockOptions>): ObeoClock => {
  const tickSource = createTickSource(options);
  // tslint:disable-next-line:variable-name
  let _state: 'stopped' | 'started' = 'stopped';
  let nextState: 'stopped' | 'started' | null = null;
  let lastUpdate = 0;
  const events = emitter<{ started: [TimeTicks], stopped: [TimeTicks] }>();

  const getSeconds = () => {
    return tickSource.getSecondsAtTime();
  };

  const getState = () => {
    return nextState || _state;
  };

  const getTicks = () => {
    return Math.ceil(tickSource.getTicksAtTime(context.now()));
  };

  const setTicks = (ticks: number) => {
    tickSource.setTicksAtTime(ticks);
  };

  const start = () => {
    const seconds = context.now();
    context.resume();
    nextState = 'started';
    tickSource.start(seconds);
  };

  const stop = () => {
    const seconds = context.now();
    nextState = 'stopped';
    tickSource.stop(seconds);
  };

  const pause = () => {
    const seconds = context.now();
    nextState = 'stopped';
    tickSource.pause(seconds);
  };

  const setTicksAtTime = (ticks: Ticks, time: ContextTime) => {
    tickSource.setTicksAtTime(ticks, time);
  };

  const loop = () => {
    const startTime = lastUpdate;
    const endTime = context.now();
    lastUpdate = endTime;

    if (nextState) {
      const ticks = getTicks();
      _state = nextState;
      nextState = null;
      events.emit(_state, {
        seconds: endTime,
        ticks,
      });
    }

    // Not really necessary but more efficient
    // This function is always being called
    if (_state === 'stopped') {
      return;
    }

    // the tick callbacks
    tickSource.forEachTickBetween(startTime, endTime, callback);
  };

  const onDidStop = (cb: (o: TimeTicks) => void) => {
    return events.on('stopped', cb);
  };

  onDidTick(loop);

  return {
    frequency: tickSource.frequency,
    getSeconds,
    getState,
    getTicks,
    setTicks,
    start,
    stop,
    pause,
    setTicksAtTime,
    onDidStop,
  };
};
