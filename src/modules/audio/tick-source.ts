import Tone from 'tone';
import { ContextTime, Ticks, Seconds } from '@/modules/audio/types';
import { Context } from '@/modules/audio/context';
import { literal } from '@/utils';

export class TickSource {
  public readonly frequency = new Tone.TickSignal();
  private state = new Tone.TimelineState('stopped');
  private tickOffset = new Tone.Timeline<{ time: number, ticks: number, seconds: number }>();

  constructor(opts: { frequency: number }) {
    this.frequency.value = opts.frequency;
    this.state.setStateAtTime('stopped', 0);
    // add the first event
    this.setTicksAtTime(0, 0);
  }

  get ticks() {
    return this.getTicksAtTime(Context.now());
  }

  set ticks(t: Ticks) {
    this.setTicksAtTime(t, Context.now());
  }

  get seconds() {
    return this.getSecondsAtTime(Context.now());
  }

  public getSecondsAtTime(time: ContextTime) {
    const stopEvent = this.state.getLastState('stopped', time);
    // this event allows forEachBetween to iterate until the current time
    const tmpEvent = { state: literal('paused'), time };
    this.state.add(tmpEvent);

    // keep track of the previous offset event
    let lastState = stopEvent;
    let elapsedSeconds = 0;

    // iterate through all the events since the last stop
    this.state.forEachBetween(stopEvent.time, time + Context.sampleTime(), (e) => {
      let periodStartTime = lastState.time;
      // if there is an offset event in this period use that
      const offsetEvent = this.tickOffset.get(e.time);
      if (offsetEvent.time >= lastState.time) {
        elapsedSeconds = offsetEvent.seconds;
        periodStartTime = offsetEvent.time;
      }
      if (lastState.state === 'started' && e.state !== 'started') {
        elapsedSeconds += e.time - periodStartTime;
      }
      lastState = e;
    });

    // remove the temporary event
    this.state.remove(tmpEvent);

    // return the ticks
    return elapsedSeconds;
  }

  public setTicksAtTime(ticks: Ticks, time: ContextTime) {
    this.tickOffset.cancel(time);
    this.tickOffset.add({
      time,
      ticks,
      seconds : this.frequency.getDurationOfTicks(ticks, time),
    });
    return this;
  }

  public getTicksAtTime(time: ContextTime) {
    const stopEvent = this.state.getLastState('stopped', time);
    // this event allows forEachBetween to iterate until the current time
    const tmpEvent = { state: 'paused', time } as const;
    this.state.add(tmpEvent);

    // keep track of the previous offset event
    let lastState = stopEvent;
    let elapsedTicks = 0;

    // iterate through all the events since the last stop
    this.state.forEachBetween(stopEvent.time, time + Context.sampleTime(), (e) => {
      let periodStartTime = lastState.time;
      // if there is an offset event in this period use that
      const offsetEvent = this.tickOffset.get(e.time);
      if (offsetEvent.time >= lastState.time) {
        elapsedTicks = offsetEvent.ticks;
        periodStartTime = offsetEvent.time;
      }
      if (lastState.state === 'started' && e.state !== 'started') {
        elapsedTicks += this.frequency.getTicksAtTime(e.time) - this.frequency.getTicksAtTime(periodStartTime);
      }
      lastState = e;
    });

    // remove the temporary event
    this.state.remove(tmpEvent);

    // return the ticks
    return elapsedTicks;
  }

  public start(time: ContextTime) {
    if (this.state.getValueAtTime(time) !== 'started') {
      this.state.setStateAtTime('started', time);
    }
  }

  public stop(time: ContextTime) {
    // cancel the previous stop
    if (this.state.getValueAtTime(time) === 'stopped') {
      const event = this.state.get(time);
      if (event.time > 0) {
        this.tickOffset.cancel(event.time);
        this.state.cancel(event.time);
      }
    }
    this.state.cancel(time);
    this.state.setStateAtTime('stopped', time);
    this.setTicksAtTime(0, time);
    return this;
  }

  public pause(time: ContextTime) {
    if (this.state.getValueAtTime(time) === 'started') {
      this.state.setStateAtTime('paused', time);
    }
  }

  public forEachTickBetween(
    startTime: ContextTime, endTime: ContextTime, callback: (time: ContextTime, ticks: Ticks,
  ) => void) {
    // only iterate through the sections where it is "started"
    let lastStateEvent = this.state.get(startTime);
    this.state.forEachBetween(startTime, endTime, (event) => {
      if (lastStateEvent.state === 'started' && event.state !== 'started') {
        this.forEachTickBetween(Math.max(lastStateEvent.time, startTime), event.time - Context.sampleTime(), callback);
      }
      lastStateEvent = event;
    });

    startTime = Math.max(lastStateEvent.time, startTime);

    let error = null;
    if (lastStateEvent.state === 'started' && this.state) {
      // figure out the difference between the frequency ticks and the
      const startTicks = this.frequency.getTicksAtTime(startTime);
      const ticksAtStart = this.frequency.getTicksAtTime(lastStateEvent.time);
      const diff = startTicks - ticksAtStart;
      let offset = diff % 1;
      if (offset !== 0) {
        offset = 1 - offset;
      }
      let nextTickTime = this.frequency.getTimeOfTick(startTicks + offset);
      while (nextTickTime < endTime && this.state) {
        try {
          callback(nextTickTime, Math.round(this.getTicksAtTime(nextTickTime)));
        } catch (e) {
          error = e;
          break;
        }
        if (this.state) {
          nextTickTime += this.frequency.getDurationOfTicks(1, nextTickTime);
        }
      }
    }

    if (error) {
      throw error;
    }
  }
}
