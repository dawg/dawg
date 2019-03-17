import Tone from 'tone';
import { ContextTime, TransportTime, Time } from './types';

// TODO Fix BPM STUFF

// An interface doesn't work for some reason
// tslint:disable-next-line:interface-over-type-literal
type Events = {
  start: [number];
  stop: [number];
  pause: [number];
  loopStart: [number, number];
  loopEnd: [number];
  loop: [number];
};

Tone.TransportRepeatEvent.prototype._createEvents = function(time) {
  // schedule the next event
  const ticks = this.Transport.getTicksAtTime(time);

  // @ts-ignore
  // console.log(ticks, this.time + this.duration);

  // @ts-ignore
  if (ticks >= this.time && ticks >= this._nextTick && this._nextTick + this._interval < this.time + this.duration) {
    // @ts-ignore
    this._nextTick += this._interval;
    // @ts-ignore
    this._currentId = this._nextId;
    // @ts-ignore
    this._nextId = this.Transport.scheduleOnce(this.invoke.bind(this), Tone.Ticks(this._nextTick));
  } else {
    // console.log('DONE');
  }
};


// A little hack to pass on time AND ticks
Tone.TransportEvent.prototype.invoke = function(time, ticks) {
  if (this.callback) {
    this.callback(time, ticks);
    if (this._once && this.Transport) {
      this.Transport.clear(this.id);
    }
  }
};

Tone.TransportRepeatEvent.prototype.invoke = function(time, ticks) {
  // create more events if necessary
  this._createEvents(time);
  // call the super class
  Tone.TransportEvent.prototype.invoke.call(this, time, ticks);
};

type Event = Tone.TransportEvent | Tone.TransportRepeatEvent;

export default class Transport extends Tone.Emitter<Events> {
  public loop = true;
  public timeline = new Tone.Timeline<Event>();
  public bpm: Tone.TickSignal;
  /**
   * Measured in ticks.
   */
  private startPosition = 0;

  private ppq = 192;
  // tslint:disable-next-line:variable-name
  private _loopStart = 0;
  // tslint:disable-next-line:variable-name
  private _loopEnd = 0;
  private clock = new Tone.Clock({
    callback: this.processTick.bind(this),
    frequency: 0,
  });
  private scheduledEvents: { [id: string]: Event } = {};

  constructor() {
    super();

    this.bpm = this.clock.frequency;
    this.bpm._toUnits = this.toUnits.bind(this);
    this.bpm._fromUnits = this.fromUnits.bind(this);
    this.bpm.value = 120;


    this.clock.on('start', (time) => {
      this.emit('start', time);
    });

    this.clock.on('stop', (time) => {
      this.emit('stop', time);
    });

    this.clock.on('pause', (time) => {
      this.emit('pause', time);
    });
  }

  /**
   * Schedule an event.
   */
  public schedule(callback: Tone.TransportCallback, time: TransportTime) {
    // @ts-ignore
    const event = new Tone.TransportEvent(this, {
      time: new Tone.TransportTime(time),
      callback,
    });

    return this.addEvent(event);
  }

  public scheduleRepeat(
    callback: Tone.TransportCallback,
    interval: Time,
    startTime: TransportTime = 0,
    duration: Time = Infinity,
  ) {
    // @ts-ignore
    const event = new Tone.TransportRepeatEvent(this, {
      callback,
      interval: new Tone.Time(interval),
      time: new Tone.TransportTime(startTime),
      duration: new Tone.Time(duration),
    });

    return this.addEvent(event);
  }

  public embed(child: Transport, time: TransportTime, duration: TransportTime) {
    const t = new Tone.Time(time);
    const ticksOffset = t.toTicks();

    const callback = (exact: number, ticks: number) => {
      child.processTick(exact, ticks - ticksOffset);
    };

    return this.scheduleRepeat(callback, '1i', time, duration);
  }

  public clear(eventId: string) {
    if (this.scheduledEvents.hasOwnProperty(eventId)) {
      const event = this.scheduledEvents[eventId];
      this.timeline.remove(event);
      event.dispose();
      delete this.scheduledEvents[eventId];
    }
    return this;
  }

  /**
   * Start playback from current position.
   */
  public start(time?: ContextTime, offset?: TransportTime) {
    if (offset !== undefined) {
      offset = this.toTicks(offset!) as number;
    }

    if (time === undefined) {
      time = Tone.Transport.context.now();
    }

    this.clock.start(time, offset);
    this.emit('start', time);
    return this;
  }

  /**
   * Pause playback.
   */
  public pause(time?: ContextTime) {
    this.clock.pause(time);
    return this;
  }

  /**
   * Stop playback and return to the beginning.
   */
  public stop(time?: ContextTime) {
    this.clock.stop(time);
    this.ticks = this.startPosition;
    return this;
  }

  public setLoopPoints(loopStart: number, loopEnd: number) {
    this.loopStart = loopStart;
    this.loopEnd = loopEnd;
    return this;
  }

  get loopStart() {
    return new Tone.Ticks(this._loopStart).toSeconds();
  }

  set loopStart(loopStart: number | string) {
    this._loopStart = this.toTicks(loopStart);
    this.seconds = this.toSeconds(loopStart);
  }

  get seconds() {
    return this.clock.seconds;
  }

  set seconds(s: number) {
    const now = Tone.Transport.context.now();
    const ticks = this.clock.frequency.timeToTicks(s, now);
    this.ticks = ticks.toTicks();
  }

  get loopEnd() {
    return new Tone.Ticks(this._loopEnd).toSeconds();
  }

  set loopEnd(loopEnd: string | number) {
    this._loopEnd = this.toTicks(loopEnd);
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
        this.emit('stop', now);
        this.clock.setTicksAtTime(t, now);
        this.emit('start', this.seconds);
      } else {
        this.clock.setTicksAtTime(t, now);
      }

      this.startPosition = t;
    }
  }

  get PPQ() {
    return this.ppq;
  }

  set PPQ(ppq: number) {
    const bpm = this.bpm;
    this.ppq = ppq;
    this.bpm = bpm;
  }

  get state() {
    return this.clock.state;
  }

  get progress() {
    if (this.loop) {
      const now = Tone.Transport.context.now();
      const ticks = this.clock.getTicksAtTime(now);
      return (ticks - this._loopStart) / (this._loopEnd - this._loopStart);
    } else {
      return 0;
    }
  }

  public get(eventId: string) {
    return this.scheduledEvents[eventId];
  }

  public getTicksAtTime(time: number) {
    return Math.round(this.clock.getTicksAtTime(time));
  }

  public scheduleOnce(callback: Tone.TransportCallback, time: TransportTime) {
    // @ts-ignore
    const event = new Tone.TransportEvent(this, {
      time : new Tone.TransportTime(time),
      callback,
      once : true,
    });
    return this.addEvent(event);
  }

  private processTick(exact: ContextTime, ticks: number) {
    // do the loop test
    if (this.loop) {
      if (ticks >= this._loopEnd) {
        this.emit('loopEnd', exact);
        this.clock.setTicksAtTime(this._loopStart, exact);
        ticks = this._loopStart;
        this.emit('loopStart', exact, this.clock.getSecondsAtTime(exact));
        this.emit('loop', exact);
      }
    }
    // invoke the timeline events scheduled on this tick
    this.timeline.forEachAtTime(ticks, (event) => {
      event.invoke(exact, ticks);
    });
  }

  private addEvent(event: Event) {
    this.timeline.add(event);
    this.scheduledEvents[event.id.toString()] = event;
    return event.id;
  }

  private fromUnits(bpm: number) {
    return 1 / (60 / bpm / this.PPQ);
  }

  private toUnits(freq: number) {
    return (freq / this.PPQ) * 60;
  }
}
