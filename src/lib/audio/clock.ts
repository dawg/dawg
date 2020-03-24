import { ContextTime, Ticks, Seconds } from '@/lib/audio/types';
import { createTickSource, ObeoTickSource, ObeoTickSourceOptions } from '@/lib/audio/tick-source';
import { emitter } from '@/lib/events';
import { ObeoTickSignal } from '@/lib/audio/tick-signal';
import { PlaybackState, createStateTimeline } from '@/lib/audio/state-timeline';
import { Disposer } from '@/lib/std';
import { getContext } from '@/lib/audio/global';
import { Getter, getter, Setter, setter } from '@/lib/reactor';

export interface ObeoClock extends Disposer {
  readonly frequency: ObeoTickSignal;
  readonly state: Getter<PlaybackState>;
  readonly ticks: Setter<Ticks>;
  readonly source: ObeoTickSource;
  start(when?: ContextTime): ObeoClock;
  stop(when?: ContextTime): ObeoClock;
  pause(when?: ContextTime): ObeoClock;
  getTicksAtTime(time?: Seconds): Ticks;
  setTicksAtTime(ticks: Ticks, time: ContextTime): void;
  onDidStop(cb: (o: TimeTicks) => void): Disposer;
  onDidStart(cb: (o: TimeTicks) => void): Disposer;
  onDidPaused(cb: (o: TimeTicks) => void): Disposer;
}

export type ObeoClockCallback = (seconds: ContextTime, ticks: Ticks) => void;

export type ObeoClockOptions = ObeoTickSourceOptions;

interface TimeTicks {
  seconds: ContextTime;
  ticks: Ticks;
}

export const createClock = (
  callback?: ObeoClockCallback,
  options?: Partial<ObeoClockOptions> | number,
): ObeoClock => {
  if (typeof options === 'number') {
    options = { frequency: options };
  }

  const definedCallback = callback ?? (() => ({}));
  const context = getContext();
  const tickSource = createTickSource(options);
  // tslint:disable-next-line:variable-name
  const _state = createStateTimeline({ initial: 'stopped' });
  let lastUpdate = 0;
  const events = emitter<{ started: [TimeTicks], stopped: [TimeTicks], paused: [TimeTicks] }>();

  const checkAlready = (when: ContextTime, newState: PlaybackState) => {
    if (when < lastUpdate) {
      events.emit(
        newState,
        { seconds: when, ticks: tickSource.getTicksAtTime(when) },
      );
    }
  };

  const start = (when?: ContextTime) => {
    when = when ?? context.now();
    context.resume();
    _state.setStateAtTime('started', when);
    tickSource.start(when);
    checkAlready(when, 'started');
    return clock;
  };

  const stop = (when?: ContextTime) => {
    when = when ?? context.now();
    _state.setStateAtTime('stopped', when);
    tickSource.stop(when);
    checkAlready(when, 'stopped');
    return clock;
  };

  const pause = (when?: ContextTime) => {
    when = when ?? context.now();
    _state.setStateAtTime('paused', when);
    tickSource.pause(when);
    checkAlready(when, 'paused');
    return clock;
  };

  const setTicksAtTime = (value: Ticks, time: ContextTime) => {
    tickSource.setTicksAtTime(value, time);
  };

  const loop = () => {
    const startTime = lastUpdate;
    const endTime = context.now();
    lastUpdate = endTime;

    _state.forEachBetween(startTime, endTime, (e) => {
      const tickValue = tickSource.getTicksAtTime(e.time);
      switch (e.state) {
        case 'started' :
          events.emit(e.state, { seconds: e.time, ticks: tickValue });
          break;
        case 'stopped' :
          if (e.time !== 0) {
            events.emit(e.state, { seconds: e.time, ticks: tickValue });
          }
          break;
        case 'paused' :
          events.emit(e.state, { seconds: e.time, ticks: tickValue });
          break;
      }
    });

    // the tick callbacks
    tickSource.forEachTickBetween(startTime, endTime, definedCallback);
  };

  const onDidStop = (cb: (o: TimeTicks) => void) => {
    return events.on('stopped', cb);
  };

  const onDidStart = (cb: (o: TimeTicks) => void) => {
    return events.on('started', cb);
  };

  const onDidPaused = (cb: (o: TimeTicks) => void) => {
    return events.on('paused', cb);
  };

  const dispose = () => {
    tickSource.dispose();
    events.removeAllListeners();
    disposer.dispose();
  };

  const state = getter(() => {
    return _state.getValueAtTime(context.now());
  });

  const ticks = setter(() => {
    return Math.ceil(tickSource.getTicksAtTime(context.now()));
  }, (value) => {
    tickSource.ticks.value = value;
  });

  const disposer = context.onDidTick(loop);

  const clock: ObeoClock =  {
    frequency: tickSource.frequency,
    source: tickSource,
    start,
    stop,
    pause,
    setTicksAtTime,
    getTicksAtTime: tickSource.getTicksAtTime,
    onDidStop,
    onDidStart,
    onDidPaused,
    state,
    ticks,
    dispose,
  };

  return clock;
};
