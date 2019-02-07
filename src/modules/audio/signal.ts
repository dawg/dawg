import Tone from 'tone';
import { TransportTime } from './types';
import Transport from './transport';
import Transport from './transport';


export class TransportTimelineSignal extends Tone.Signal {
  private lastValue: number;
  private output: Tone.Signal;
  private callback: (time: number) => void;

  constructor() {
    super();

    /**
     * The real signal output
     * @type {Tone.Signal}
     * @private
     */
    this.output = new Tone.Signal();
    this.lastValue = this.value;

    /**
     * The event id of the tick update loop
     * @private
     * @type {Number}
     */

    this.callback = this._anchorValue.bind(this);

    // @ts-ignore
    this._events.memory = Infinity;
  }

  public sync(transport: Transport<any>, time: TransportTime) {
    transport.on('start', this.callback).on('stop', this.callback).on('pause', this.callback);
    return transport.scheduleRepeat(this.onTick, '1i', time);
  }

  public onTick(time: number) {
    const val = this.getValueAtTime(Tone.Transport.seconds);
    if (this.lastValue !== val) {
      this.lastValue = val;
      // approximate ramp curves with linear ramps
      this.output.linearRampToValueAtTime(val, time);
    }
  }

  public _anchorValue(time: number) {
    const val = this.getValueAtTime(Tone.Transport.seconds);
    this.lastValue = val;
    this.output.cancelScheduledValues(time);
    this.output.setValueAtTime(val, time);
  }

  public getValueAtTime(time: TransportTime) {
    const tt = new Tone.TransportTime(time);
    return super.getValueAtTime.call(this, tt);
  }

  public setValueAtTime(value: number, time: TransportTime) {
    const tt = new Tone.TransportTime(time);
    super.setValueAtTime.call(this, value, tt);
    return this;
  }

  public linearRampToValueAtTime(value: number, time: TransportTime) {
    const tt = new Tone.TransportTime(time);
    super.linearRampToValueAtTime.call(this, value, tt);
    return this;
  }

  public exponentialRampToValueAtTime(value: number, time: TransportTime) {
    const tt = new Tone.TransportTime(time);
    super.exponentialRampToValueAtTime.call(this, value, tt);
    return this;
  }

  public setTargetAtTime(value: number, startTime: TransportTime, timeConstant: number) {
    const tt = new Tone.TransportTime(startTime);
    super.setTargetAtTime.call(this, value, tt, timeConstant);
    return this;
  }

  public cancelScheduledValues(startTime: TransportTime) {
    const tt = new Tone.TransportTime(startTime);
    super.cancelScheduledValues.call(this, tt);
    return this;
  }

  public dispose() {
    // this.part.clear(this.synced);
    // this.part.off('start', this.callback).off('stop', this.callback).off('pause', this.callback);
    // @ts-ignore
    this._events.cancel(0);
    super.dispose.call(this);
    this.output.dispose();
    return this;
  }

}
