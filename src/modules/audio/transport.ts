import Tone from 'tone';
import { Timeline } from '@/modules/audio/timeline';
import { ContextTime, Time, Ticks, Seconds, Beat } from '@/modules/audio/types';
import { Context } from '@/modules/audio/context';

// FIXME Ok so this type definition is not 100% correct as the duration does not NEED to be defined iff onEnd AND onTick
// are undefined.
// TODO make all of the objects accept on object, now two numbers
export interface TransportEvent {
  time: Ticks;
  // Must be defined if `onMidStart` OR `onEnd` OR `onTick` are defined
  duration: Ticks;
  // Called ONLY at the start of the event
  onStart?: (currentTime: ContextTime, currentTick: Ticks) => void;
  // Called when the event is started at ANY point during its duration, EXCLUDING the start
  onMidStart?: (context: { seconds: ContextTime, ticks: Ticks, secondsOffset: Seconds, ticksOffset: Ticks }) => void;
  // Called when the event is stopped at ANY point during its duration, EXCLUDING the end
  onMidEnd?: (context: { seconds: ContextTime, ticks: Ticks, secondsOffset: Seconds, ticksOffset: Ticks }) => void;
  // Called when the event is finished. This includes at the end its end time, when the clock is paused, when the
  // the clock is stopped, if the event is suddenly rescheduled such that the end time is less than the current time
  // or if the event is suddenly rescheduled such that the start time is after the current time.
  onEnd?: (currentTime: ContextTime, currentTick: Ticks) => void;
  // Called on each tick while the event is active (when the current time >= start time AND the current time <= start
  // time + duration).
  onTick?: (currentTime: ContextTime, currentTick: Ticks) => void;
}

export interface TransportEventController {
  setStartTime(startTime: Ticks): void;
  setDuration(startTime: Ticks): void;
  remove(): void;
}

export class Transport {
  public bpm: Tone.TickSignal;
  private startPosition: Ticks = 0;
  private timeline = new Timeline<TransportEvent>();
  private active: TransportEvent[] = [];

  // tslint:disable-next-line:variable-name
  private _loopStart: Ticks = 0;
  // tslint:disable-next-line:variable-name
  private _loopEnd: Ticks = 0;
  private clock = new Tone.Clock({
    callback: this.processTick.bind(this),
    frequency: 0,
  });

  constructor() {
    // FIXME Uh I hate this
    this.bpm = this.clock.frequency;
    this.bpm._toUnits = (freq: number) => {
      return (freq / Context.PPQ) * 60;
    };
    this.bpm._fromUnits = (bpm: number) => {
      return 1 / (60 / bpm / Context.PPQ);
    };

    // TODO Uh this should be defined someplace
    this.bpm.value = 120;
  }

  /**
   * Schedule an event.
   */
  public schedule(event: TransportEvent) {
    // make a copy so setting values does nothing
    event = {
      ...event,
      duration: Context.beatsToTicks(event.duration),
      time: Context.beatsToTicks(event.time),
    };
    this.timeline.add(event);

    const checkNowActive = () => {
      // If the event hasn't started yet or if it has already ended, we don't care
      const current = this.clock.ticks;
      const startTime = event.time;
      const endTime = startTime + event.duration;
      if (
        startTime > current ||
        endTime < current
      ) {
        return;
      }

      // If it's already in there, we don't need to add it
      const index = this.active.indexOf(event);
      if (index !== -1) {
        return;
      }

      // Ok now we now that the event needs to be retroactively added to the active list
      if (event.onTick || event.onEnd || event.onMidEnd) {
        this.active.push(event);
      }

      // Ok so we the event is now active, but we have to make sure to call the correct function
      if (startTime === current) {
        if (event.onStart) {
          event.onStart(this.clock.seconds, this.clock.ticks);
        }
      } else {
        if (event.onStart) {
          if (event.onMidStart) {
            // TODO duplication
            const ticksOffset = this.clock.ticks - event.time;
            const secondsOffset = Context.ticksToSeconds(ticksOffset);
            event.onMidStart({
              seconds: this.clock.seconds,
              ticks: this.clock.ticks,
              secondsOffset,
              ticksOffset,
            });
          }
        }
      }
    };

    return {
      setStartTime: (startTime: Beat) => {
        startTime = Context.beatsToTicks(startTime);
        event.time = startTime;
        checkNowActive();
      },
      setDuration: (duration: Beat) => {
        duration = Context.beatsToTicks(duration);
        event.duration = duration;
        checkNowActive();
      },
      remove: () => {
        this.timeline.remove(event);
        if (!this.active) {
          return;
        }

        const i = this.active.indexOf(event);
        if (i >= 0) {
          if (event.onEnd) {
            event.onEnd(this.clock.ticks, this.clock.seconds);
          }

          this.active.splice(i, 1);
        }
      },
    };
  }

  public embed(child: Transport, tick: Ticks, duration: Ticks) {
    return this.schedule({
      onTick: (exact: number, currentTick: number) => {
        // We subtract the `tick` value because the given transport is positioned relative to this transport.
        // For example, if we embed transport A in transport B at tick 1 and the callback is called at tick 2, we want
        // transport A to think it is time tick 1
        child.processTick(exact, currentTick - tick);
      },
      time: tick,
      duration,
    });
  }

  /**
   * Start playback from current position.
   */
  public start() {
    this.checkMidStartEvents();
    this.clock.start();
  }

  /**
   * Pause playback.
   */
  public pause() {
    this.clock.pause();
    // TODO consolidate pause and stop
    this.active.forEach((event) => {
      if (event.onEnd) {
        // TODO is the clock.seconds and clock.ticks correct?
        event.onEnd(this.clock.seconds, this.clock.ticks);
      }
    });
    this.active = [];
  }

  /**
   * Stop playback and return to the beginning.
   */
  public stop() {
    this.clock.stop();
    this.active.forEach((event) => {
      if (event.onEnd) {
        // TODO is the clock.seconds and clock.ticks correct?
        event.onEnd(this.clock.seconds, this.clock.ticks);
      }
    });
    this.active = [];
    this.ticks = this.startPosition;
  }

  get loopStart() {
    return new Tone.Ticks(this._loopStart).toSeconds();
  }

  set loopStart(loopStart: Ticks) {
    this._loopStart = loopStart * Context.PPQ;
    this.ticks = loopStart * Context.PPQ;
  }

  get seconds() {
    return this.clock.seconds;
  }

  set seconds(s: number) {
    const now = Tone.Transport.context.now();
    const ticks = this.clock.frequency.timeToTicks(s, now);
    this.ticks = ticks.toTicks();
  }

  // TODO change everything that references this to ticks
  get loopEnd() {
    return this._loopEnd;
  }

  set loopEnd(loopEnd: Beat) {
    this._loopEnd = loopEnd * Context.PPQ;
  }

  get ticks() {
    return this.clock.ticks;
  }


  set ticks(t: number) {
    if (this.clock.ticks !== t) {
      const now = Tone.Transport.context.now();
      // stop everything synced to the transport
      if (this.state === 'started') {
        // restart it with the new time
        this.clock.setTicksAtTime(t, now);
      } else {
        this.clock.setTicksAtTime(t, now);
      }

      this.startPosition = t;
    }
  }

  get beat() {
    return this.ticks / Context.PPQ;
  }

  set beat(beat: number) {
    this.ticks = beat * Context.PPQ;
  }

  get state() {
    return this.clock.state;
  }

  public getProgress() {
    const now = Tone.Transport.context.now();
    const ticks = this.clock.getTicksAtTime(now);
    return (ticks - this._loopStart) / (this._loopEnd - this._loopStart);
  }

  public getTicksAtTime(time: number) {
    return Math.round(this.clock.getTicksAtTime(time));
  }

  public getSecondsAtTime(time: Time) {
    return this.clock.getSecondsAtTime(time);
  }

  private checkMidStartEvents() {
    // The upper bound is exclusive but we don't care about checking about events that haven't started yet.
    // On the first tick these events will be found.
    this.timeline.forEachBetween(0, this.clock.ticks, (event) => {
      if (event.time + event.duration < this.clock.ticks) {
        return;
      }

      if (event.onMidStart) {
        const ticksOffset = this.clock.ticks - event.time;
        const secondsOffset = Context.ticksToSeconds(ticksOffset);
        event.onMidStart({
          seconds: this.clock.seconds,
          ticks: this.clock.ticks,
          secondsOffset,
          ticksOffset,
        });
      }

      // Again, we DON't CARE about event that don't need to ba called again
      if (event.onTick || event.onEnd || event.onMidEnd) {
        this.active.push(event);
      }
    });
  }

  private processTick(exact: ContextTime, ticks: number) {
    if (ticks >= this._loopEnd) {
      // TODO duplication
      this.active.forEach((event) => {
        if (event.onEnd) {
          // TODO is the clock.seconds and clock.ticks correct?
          event.onEnd(this.clock.seconds, this.clock.ticks);
        }
      });
      this.checkMidStartEvents();
      this.active = [];

      this.clock.setTicksAtTime(this._loopStart, exact);
      ticks = this._loopStart;
    }

    // Invoke onTick callbacks for events scheduled on this tick.
    // Also, add them to the active list of events if required.
    this.timeline.forEachAtTime(ticks, (event) => {
      if (event.onStart) {
        event.onStart(exact, ticks);
      }

      // If neither of these is defined then we don't really care about it anymore
      if (event.onTick || event.onEnd || event.onMidEnd) {
        this.active.push(event);
      }
    });

    this.active = this.active.filter((event) => {
      const endTime = event.time + event.duration;
      if (endTime < ticks) {
        // This occurs if the start time was reduced or the duration was reduced such that the end time became less
        // than the current time.
        if (event.onEnd) { event.onEnd(exact, ticks); }
      } else if (endTime === ticks) {
        // If we've reached the end of the event than still call onTick and then onEnd as well.
        if (event.onTick) { event.onTick(exact, ticks); }
        if (event.onEnd) { event.onEnd(exact, ticks); }
      } else if (event.time > ticks) {
        // This can happen if the event is rescheduled such that it starts after the current time
        if (event.onEnd) { event.onEnd(exact, ticks); }
      } else {
        if (event.onTick) { event.onTick(exact, ticks); }
      }

      // Keep iff the end time has not passed and the start time has passed
      return ticks < endTime && event.time < ticks;
    });
  }
}
