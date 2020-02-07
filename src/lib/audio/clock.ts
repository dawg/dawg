import Tone from 'tone';
import { Context } from '@/lib/audio/context';
import { ContextTime, Ticks } from '@/lib/audio/types';
import { TickSource } from '@/lib/audio/tick-source';
import { StrictEventEmitter } from '@/lib/events';

interface ClockOptions {
  callback: (seconds: ContextTime, ticks: Ticks) => void;
  frequency: number;
}

interface TimeTicks {
  seconds: ContextTime;
  ticks: Ticks;
}

export class Clock extends StrictEventEmitter<{ started: [TimeTicks], stopped: [TimeTicks] }> {
  public readonly frequency: Tone.TickSignal;
  private callback: (seconds: ContextTime, ticks: Ticks) => void;
  private tickSource: TickSource;
  // tslint:disable-next-line:variable-name
  private _state: 'stopped' | 'started' = 'stopped';
  private nextState: 'stopped' | 'started' | null = null;
  private boundLoop: () => void;
  private lastUpdate = 0;

  constructor(options: ClockOptions) {
    super();
    this.callback = options.callback;
    this.tickSource = new TickSource({ frequency: options.frequency });
    this.frequency = this.tickSource.frequency;
    this.boundLoop = this.loop.bind(this);
    Context.onDidTick(this.boundLoop);
  }

  get seconds() {
    return this.tickSource.seconds;
  }

  get state() {
    return this.nextState || this._state;
  }

  get ticks() {
    return Math.ceil(this.getTicksAtTime(Context.now()));
  }

  set ticks(t: number) {
    this.tickSource.ticks = t;
  }

  public start() {
    const seconds = Context.now();
    Context.resume();
    this.nextState = 'started';
    this.tickSource.start(seconds);
  }

  public stop() {
    const seconds = Context.now();
    this.nextState = 'stopped';
    this.tickSource.stop(seconds);
  }

  public pause() {
    const seconds = Context.now();
    this.nextState = 'stopped';
    this.tickSource.pause(seconds);
  }

  public setTicksAtTime(ticks: Ticks, time: ContextTime) {
    this.tickSource.setTicksAtTime(ticks, time);
    return this;
  }

  public getTicksAtTime(time: ContextTime) {
    return this.tickSource.getTicksAtTime(time);
  }

  private loop() {
    const startTime = this.lastUpdate;
    const endTime = Context.now();
    this.lastUpdate = endTime;

    if (this.nextState) {
      const ticks = this.ticks;
      this._state = this.nextState;
      this.nextState = null;
      this.emit(this._state, {
        seconds: endTime,
        ticks,
      });
    }

    // Not really necessary but more efficient
    // This function is always being called
    if (this._state === 'stopped') {
      return;
    }

    // the tick callbacks
    this.tickSource.forEachTickBetween(startTime, endTime, this.callback);
  }
}
