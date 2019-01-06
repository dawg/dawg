import Tone from 'tone';
import global from './global';
import { ContextTime, Ticks } from './types';

type Callback = (time: ContextTime, ticks: Ticks) => void;

const noOp = () => {
  //
};

export default class Clock extends Tone.Emitter<{start: any, stop: any, pause: any}> {
  public tickSource: Tone.TickSource;
  public timeline = new Tone.TimelineState('stopped');
  // tslint:disable-next-line:variable-name
  private _lastUpdate = 0;
  private callback: Callback;

  constructor(options: { frequency?: number, callback?: Callback } = {}) {
    super();
    this.tickSource = new Tone.TickSource(options.frequency || 1);
    this.callback = options.callback || noOp;
    this.timeline.setStateAtTime('stopped', 0);
    global.context.on('tick', this._loop.bind(this));
  }

  /**
   *
   * @param time When the clock should start. Defaults to now.
   * @param offset Where the tick counter starts counting from.
   */
  public start(time?: PrimitiveTime, offset?: PrimitiveTicks) {
    // make sure the context is started
    global.context.resume();

    // start the loop
    time = this.toSeconds(time);
    if (this.timeline.getValueAtTime(time) !== 'started') {
      this.timeline.setStateAtTime('started', time);
      this.tickSource.start(time, offset);
      if (time < this._lastUpdate) {
        this.emit('start', time, offset);
      }
    }
    return this;
  }


 public stop(time: PrimitiveTime) {
    time = this.toSeconds(time);
    this.timeline.cancel(time);
    this.timeline.setStateAtTime('stopped', time);
    this.tickSource.stop(time);
    if (time < this._lastUpdate) {
      this.emit('stop', time);
    }
    return this;
  }

  get state() {
    return this.timeline.getValueAtTime(global.context.now());
  }

  public pause(time: PrimitiveTime) {
    time = this.toSeconds(time);
    if (this.timeline.getValueAtTime(time) === 'started') {
      this.timeline.setStateAtTime('paused', time);
      this.tickSource.pause(time);
      if (time < this._lastUpdate) {
        this.emit('pause', time);
      }
    }
    return this;
  }

  public setTicksAtTime(ticks: number, time: number) {
    this.tickSource.setTicksAtTime(ticks, time);
    return this;
  }

  private _loop() {
    const startTime = this._lastUpdate;
    const endTime = global.context.now();
    this._lastUpdate = endTime;

    if (startTime !== endTime) {
      // the state change events
      this.timeline.forEachBetween(startTime, endTime, (e) => {
        switch (e.state) {
          case 'started':
            const offset = this.tickSource.getTicksAtTime(e.time);
            this.emit('start', e.time, offset);
            break;
          case 'stopped':
            if (e.time !== 0) {
              this.emit('stop', e.time);
            }
            break;
          case 'paused':
            this.emit('pause', e.time);
            break;
        }
      });
      // the tick callbacks
      this.tickSource.forEachTickBetween(startTime, endTime, (time, ticks) => {
        this.callback(time, ticks);
      });
    }
  }
}
