import { Timeline } from '@/lib/audio/timeline';
import { ContextTime, Ticks, Seconds, Beat } from '@/lib/audio/types';
import { Context } from '@/lib/audio/context';
import { watch } from '@vue/composition-api';
import { Clock } from '@/lib/audio/clock';
import { StrictEventEmitter } from '@/lib/events';
import { Disposer } from '@/lib/std';

interface EventContext {
  seconds: ContextTime;
  ticks: Ticks;
}

// FIXME Ok so this type definition is not 100% correct as the duration does not NEED to be defined iff onEnd AND onTick
// are undefined.
export interface TransportEvent {
  time: Ticks;
  // Must be defined if `onMidStart` OR `onEnd` OR `onTick` are defined
  duration: Ticks;
  offset: Ticks;
  // Called ONLY at the start of the event
  onStart?: (context: EventContext) => void;
  // Called when the event is started at ANY point during its duration, EXCLUDING the start
  onMidStart?: (context: { seconds: ContextTime, ticks: Ticks, secondsOffset: Seconds, ticksOffset: Ticks }) => void;
  // Called when the event is finished. This includes at the end its end time, when the clock is paused, when the
  // the clock is stopped, if the event is suddenly rescheduled such that the end time is less than the current time
  // or if the event is suddenly rescheduled such that the start time is after the current time.
  onEnd?: (context: EventContext) => void;
  // Called on each tick while the event is active (when the current time >= start time AND the current time <= start
  // time + duration).
  onTick?: (context: EventContext) => void;
}

export interface TransportEventController {
  setStartTime(startTime: Beat): void;
  setOffset(offset: Beat): void;
  setDuration(duration: Beat): void;
  remove(): Disposer;
}

export class Transport extends StrictEventEmitter<{ beforeStart: [EventContext], beforeEnd: [EventContext] }> {
  private startPosition: Ticks = 0;
  private timeline = new Timeline<TransportEvent>();
  private active: TransportEvent[] = [];
  private isFirstTick = false;

  // tslint:disable-next-line:variable-name
  private _loopStart: Ticks = 0;
  // tslint:disable-next-line:variable-name
  private _loopEnd: Ticks = 0;
  private clock = new Clock({
    callback: this.processTick.bind(this),
    frequency: 0,
  });
  private disposer: () => void;

  constructor() {
    super();

    const setBpm = () => this.clock.frequency.value = 1 / (60 / Context.BPM / Context.PPQ);

    // FIXME Maybe all of the clocks could share one "ticker"?? IDK? Then we wouldn't have to "watch" the BBM
    // Note, this will run automatically
    const d = Context.onDidSetBPM(setBpm);

    const pause = this.clock.on('stopped', (o) => {
      this.checkOnEndEventsAndResetActive(o);
    });

    this.disposer = () => {
      // d.dispose();
      // pause.dispose();
    };
  }

  /**
   * Schedule an event.
   */
  public schedule(event: TransportEvent): TransportEventController {
    // make a copy so setting values does nothing
    event = {
      ...event,
      // FIXME we probably shouldn't be converting to beats here??
      duration: Context.beatsToTicks(event.duration),
      time: Context.beatsToTicks(event.time),
      offset: Context.beatsToTicks(event.offset),
    };
    this.timeline.add(event);

    const checkNowActive = () => {
      if (this.state !== 'started') {
        return;
      }

      // If the event hasn't started yet or if it has already ended, we don't care
      const current = this.clock.ticks;
      const startTime = event.time + event.offset;
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
      if (event.onTick || event.onEnd) {
        this.active.push(event);
      }

      // Ok so we the event is now active, but we have to make sure to call the correct function
      if (startTime === current) {
        if (event.onStart) {
          event.onStart({
            seconds: Context.now(),
            ticks: this.clock.ticks,
          });
        }
      } else {
        this.checkMidStart(event, {
          seconds: Context.now(),
          ticks: this.clock.ticks,
        });
      }
    };

    let added = true;
    return {
      setStartTime: (startTime: Beat) => {
        event.time = Context.beatsToTicks(startTime);
        // So we need to reposition the element in the sorted array after setting the time
        // This is a very simple way to do it but it could be done more efficiently
        this.timeline.remove(event);
        this.timeline.add(event);
        checkNowActive();
      },
      setDuration: (duration: Beat) => {
        event.duration = Context.beatsToTicks(duration);
        checkNowActive();
      },
      setOffset: (offset: Beat) => {
        event.offset = Context.beatsToTicks(offset);
        // We also need to make sure it's sorted here
        this.timeline.remove(event);
        this.timeline.add(event);
        checkNowActive();
      },
      remove: () => {
        if (!added) {
          return {
            dispose: () => {
              //
            },
          };
        }

        this.timeline.remove(event);
        added = false;

        const dispose = () => {
          this.timeline.add(event);
          added = true;

          checkNowActive();
        };

        if (!this.active) {
          return {
            dispose,
          };
        }

        const i = this.active.indexOf(event);
        if (i >= 0) {
          if (event.onEnd) {
            event.onEnd({
              ticks: this.clock.ticks,
              seconds: Context.now(),
            });
          }

          this.active.splice(i, 1);
        }

        return {
          dispose,
        };
      },
    };
  }

  public embed(child: Transport, ticks: Ticks, duration: Ticks) {
    return this.schedule({
      onStart: () => {
        child.isFirstTick = true;
      },
      onMidStart: () => {
        child.isFirstTick = true;
      },
      onTick({ seconds, ticks: currentTick }) {
        // We subtract the `tick` value because the given transport is positioned relative to this transport.
        // For example, if we embed transport A in transport B at tick 1 and the callback is called at tick 2, we want
        // transport A to think it is time tick 1
        child.processTick(seconds, currentTick - this.time, true);
      },
      time: ticks,
      offset: 0,
      duration,
    });
  }

  /**
   * Start playback from current position.
   */
  public start() {
    this.isFirstTick = true;
    this.clock.start();
  }

  /**
   * Pause playback.
   */
  public pause() {
    this.clock.pause();
  }

  /**
   * Stop playback and return to the beginning.
   */
  public stop() {
    this.clock.stop();
    this.ticks = this.startPosition;
  }

  public dispose() {
    this.disposer();
  }

  get loopStart() {
    return this._loopStart / Context.PPQ;
  }

  set loopStart(loopStart: Beat) {
    this._loopStart = loopStart * Context.PPQ;
  }

  get seconds() {
    return this.clock.seconds;
  }

  get loopEnd() {
    return this._loopEnd / Context.PPQ;
  }

  set loopEnd(loopEnd: Beat) {
    this._loopEnd = loopEnd * Context.PPQ;
  }

  get ticks() {
    return this.clock.ticks;
  }

  set ticks(t: number) {
    if (this.clock.ticks !== t) {
      const now = Context.now();
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
    return (this.ticks - this._loopStart) / (this._loopEnd - this._loopStart);
  }

  private checkMidStart(event: TransportEvent, c: EventContext) {
    if (event.onMidStart) {
      const ticksOffset = c.ticks - event.time;
      const secondsOffset = Context.ticksToSeconds(ticksOffset);
      event.onMidStart({
        ...c,
        secondsOffset,
        ticksOffset,
      });
    }
  }

  private checkOnEndEventsAndResetActive(c: EventContext) {
    this.active.forEach((event) => {
      if (event.onEnd) {
        event.onEnd(c);
      }
    });
    this.active = [];
  }

  private processTick(seconds: ContextTime, ticks: Ticks, isChild = false) {
    if (!isChild && ticks >= this._loopEnd) {
      this.emit('beforeEnd', { seconds, ticks });
      this.checkOnEndEventsAndResetActive({ seconds, ticks });
      this.clock.setTicksAtTime(this._loopStart, seconds);
      ticks = this._loopStart;
      this.isFirstTick = true;
    }

    if (this.isFirstTick) {
      this.emit('beforeStart', { seconds, ticks });

      // The upper bound is exclusive but we don't care about checking about events that haven't started yet.
      this.timeline.forEachBetween(0, ticks, (event) => {
        // Check if it's already finished
        if (event.time + event.duration < ticks) {
          return;
        }

        this.checkMidStart(event, {
          seconds,
          ticks,
        });

        // Again, we DON't CARE about event that don't need to ba called again
        if (event.onTick || event.onEnd) {
          this.active.push(event);
        }
      });
      this.isFirstTick = false;
    }

    // Invoke onTick callbacks for events scheduled on this tick.
    // Also, add them to the active list of events if required.
    this.timeline.forEachAtTime(ticks, (event) => {
      if (event.onStart) {
        event.onStart({
          seconds,
          ticks,
        });
      }

      // If neither of these is defined then we don't really care about it anymore
      if (event.onTick || event.onEnd) {
        this.active.push(event);
      }
    });

    this.active = this.active.filter((event) => {
      const endTime = event.time + event.duration;
      const startTime = event.time + event.offset;
      if (endTime < ticks) {
        // This occurs if the start time was reduced or the duration was reduced such that the end time became less
        // than the current time.
        if (event.onEnd) { event.onEnd({ seconds, ticks }); }
      } else if (endTime === ticks) {
        // If we've reached the end of the event than still call onTick and then onEnd as well.
        if (event.onTick) { event.onTick({ seconds, ticks }); }
        if (event.onEnd) { event.onEnd({ seconds, ticks }); }
      } else if (startTime > ticks) {
        // This can happen if the event is rescheduled such that it starts after the current time
        if (event.onEnd) { event.onEnd({ seconds, ticks }); }
      } else {
        if (event.onTick) { event.onTick({ seconds, ticks }); }
      }

      // Keep iff the end time has not passed and the start time has passed
      return ticks < endTime && startTime <= ticks;
    });
  }
}
