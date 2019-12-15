import Tone from 'tone';
import { Context } from '@/modules/audio/context';
import { ContextTime, Ticks } from '@/modules/audio/types';
import { TickSource } from '@/modules/audio/tick-source';

interface ClockOptions {
  callback: (seconds: ContextTime, ticks: Ticks) => void;
  frequency: number;
}

interface TimeTicks {
  seconds: ContextTime;
  ticks: Ticks;
}

export class Clock extends Tone.Emitter<{ start: [TimeTicks], pause: [TimeTicks], stop: [TimeTicks] }> {
  public readonly frequency: Tone.TickSignal;
  private callback: (seconds: ContextTime, ticks: Ticks) => void;
  private tickSource: TickSource;
  private timeline = new Tone.TimelineState('stopped');
  private boundLoop: () => void;
  private lastUpdate = 0;

  constructor(options: ClockOptions) {
    super();
    this.callback = options.callback;
    this.tickSource = new TickSource({ frequency: options.frequency });
    this.frequency = this.tickSource.frequency;
    this.timeline.setStateAtTime('stopped', 0);
    this.boundLoop = this.loop.bind(this);
    Context.onDidTick(this.boundLoop);
  }

  get seconds() {
    return this.tickSource.seconds;
  }

  get state() {
    return this.timeline.getValueAtTime(this.now());
  }

  get ticks() {
    return Math.ceil(this.getTicksAtTime(this.now()));
  }

  set ticks(t: number) {
    this.tickSource.ticks = t;
  }

  public start(seconds: ContextTime) {
    this.context.resume();
    // start the loop
    if (this.timeline.getValueAtTime(seconds) !== 'started') {
      this.timeline.setStateAtTime('started', seconds);
      this.tickSource.start(seconds);
      if (seconds < this.lastUpdate) {
        this.emit('start', {
          seconds,
          ticks: this.ticks,
        });
      }
    }
    return this;
  }

  public stop(seconds: ContextTime) {
    this.timeline.cancel(seconds);
    this.timeline.setStateAtTime('stopped', seconds);
    this.tickSource.stop(seconds);
    if (seconds < this.lastUpdate) {
      this.emit('stop', {
        seconds,
        ticks: this.ticks,
      });
    }
    return this;
  }

  public pause(seconds: ContextTime) {
    if (this.timeline.getValueAtTime(seconds) === 'started') {
      this.timeline.setStateAtTime('paused', seconds);
      this.tickSource.pause(seconds);
      if (seconds < this.lastUpdate) {
        this.emit('pause', {
          seconds,
          ticks: this.ticks,
        });
      }
    }
    return this;
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
    const endTime = this.now();
    this.lastUpdate = endTime;

    if (startTime !== endTime) {
      const ticks = this.ticks;
      // the state change events
      this.timeline.forEachBetween(startTime, endTime, (e) => {
        const seconds = e.time;
        switch (e.state) {
          case 'started' :
            this.tickSource.getTicksAtTime(seconds);
            this.emit('start', {
              seconds,
              ticks,
            });
            break;
          case 'stopped' :
            if (seconds !== 0) {
              this.emit('stop', {
                seconds,
                ticks,
              });
            }
            break;
          case 'paused' :
            this.emit('pause', {
              seconds,
              ticks,
            });
            break;
        }
      });
      // the tick callbacks
      this.tickSource.forEachTickBetween(startTime, endTime, this.callback);
    }
  }
}
