import Tone from 'tone';
import { ContextTime, TransportTime } from './types';
// import Clock from './clock';

type Callback = (time: ContextTime) => void;

export default class Part<T> {
  public loop = true;
  private ppq = 192;
  private timeline = new Tone.Timeline<Tone.TransportEvent>();
  // tslint:disable-next-line:variable-name
  private _loopStart = 0;
  // tslint:disable-next-line:variable-name
  private _loopEnd = 0;
  private clock = new Tone.Clock({
    callback: this.onTick.bind(this),
    frequency: 0,
  });
  private scheduledEvents: { [k: string]: Tone.TransportEvent } = {};
  private groups: Array<[string, T]> = [];
  // private callback: (time: ContextTime, o: T) => void;

  constructor(private callback: (time: ContextTime, o: T) => void) {
    // defaults
    this.bpm = 120;
  }

  /**
   * Schedule an event.
   */
  public schedule(callback: (time: ContextTime) => void, time: TransportTime) {
    const event = new Tone.TransportEvent(null, {
      time: new Tone.TransportTime(time),
      callback,
    });
    this.scheduledEvents[event.id.toString()] = event;
    this.timeline.add(event);
    return event.id;
  }
  /**
   * Reschedule to a different time.
   */
  public reschedule() {
    //
  }

  public add(time: TransportTime, o: T) {
    const eventId = this.schedule((t) => this.callback(t, o), time);
    this.groups.push([eventId, o]);
    return this;
  }

  public remove(o: T) {
    this.groups.forEach(([eventId, other], i) => {
      if (o === other) {
        this.clear(eventId);
        this.groups.splice(i, 1);
      }
    });
  }

  public clear(eventId: string) {
    if (this.scheduledEvents.hasOwnProperty(eventId)) {
      const event = this.scheduledEvents[eventId.toString()];
      this.timeline.remove(event);
      event.dispose();
      delete this.scheduledEvents[eventId.toString()];
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
    this.clock.start(time, offset);
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
  set loopEnd(loopEnd: number | string) {
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
        this.clock.setTicksAtTime(t, now);
      } else {
        this.clock.setTicksAtTime(t, now);
      }
    }
  }

  set bpm(bpm: number) {
    this.clock.frequency.value = 1 / (60 / bpm / this.PPQ);
  }

  get bpm() {
    return (this.clock.frequency.value / this.PPQ) * 60;
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

  private onTick(tickTime: ContextTime, ticks: number) {
    // do the loop test
    if (this.loop) {
      if (ticks >= this._loopEnd) {
        this.clock.setTicksAtTime(this._loopStart, tickTime);
        ticks = this._loopStart;
      }
    }
    // invoke the timeline events scheduled on this tick
    this.timeline.forEachAtTime(ticks, (event) => {
      event.invoke(tickTime);
    });
  }

  private toTicks(time: any) {
    // @ts-ignore
    if (Tone.isNumber(time) || Tone.isString(time) || Tone.isObject(time)) {
      return (new Tone.TransportTime(time)).toTicks();
      // @ts-ignore
    } else if (Tone.isUndef(time)) {
      // @ts-ignore
      return Tone.Transport.ticks;
    } else if (time instanceof Tone.TimeBase) {
      // @ts-ignore
      return time.toTicks();
    }
  }
}
