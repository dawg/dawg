import Tone from 'tone';
import Global from './global';
export default class Part {
  public loop = true;
  // tslint:disable-next-line:variable-name
  private _loopStart = 0;
  // tslint:disable-next-line:variable-name
  private _loopEnd = 0;
  private clock = new Tone.Clock({
    callback: this.onTick,
    frequency: 0,
  });
  private timeline = new Tone.Timeline();
  private scheduledEvents: { [k: string]: Tone.TransportEvent } = {};

  /**
   * Schedule an event.
   */
  public schedule(callback: (time: number) => void, time: number) {
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
  public play() {
    //
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

  private onTick(tickTime: number, ticks: number) {
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


  get loopStart() {
    return this._loopStart;
  }
  set loopStart(loopStart: number) {
    this._loopStart = loopStart * Global.PPQ;
  }

  get loopEnd() {
    return this._loopEnd;
  }
  set loopEnd(loopEnd: number) {
    this._loopEnd = loopEnd * Global.PPQ;
  }
}
