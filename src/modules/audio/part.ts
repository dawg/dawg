import Tone from 'tone';
// import global from './global';
import { ContextTime, TransportTime } from './types';
// import Clock from './clock';

export default class Part {
  get loopStart() {
    return new Tone.Ticks(this._loopStart).toSeconds();
  }
  set loopStart(loopStart: number) {
    this._loopStart = this.toTicks(loopStart);
  }

  get loopEnd() {
    return new Tone.Ticks(this._loopEnd).toSeconds();
  }
  set loopEnd(loopEnd: number) {
    this._loopEnd = this.toTicks(loopEnd);
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

  constructor() {
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

  /**
   * Start playback from current position.
   */
  public start(time?: ContextTime, offset?: TransportTime) {
    if (offset) {
      offset = this.toTicks(offset!);
    }
    this.clock.start(time, offset);
    return this;
  }

  /**
   * Pause playback.
   */
  public pause() {
    //
  }

  /**
   * Stop playback and return to the beginning.
   */
  public stop() {
    //
  }

  public setLoopPoints(loopStart: number, loopEnd: number) {
    this.loopStart = loopStart;
    this.loopEnd = loopEnd;
    return this;
  }

  private toUnits(freq: number) {
    return ;
  }

  private fromUnits(bpm: number) {
    return;
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
