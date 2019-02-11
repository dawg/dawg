import Tone from 'tone';

export class Signal {
  public raw = 0;

  constructor(public signal: Tone.Signal) {
    this.raw = signal.value;
  }

  get value() {
    return this.signal.value;
  }

  set value(value: number) {
    this.signal.value = value;
    this.raw = value;
  }

  public linearRampToValueAtTime(value: number, time: number) {
    this.signal.linearRampToValueAtTime(value, time);
    this.raw = value;
  }

  public cancelScheduledValues(time: number) {
    this.signal.cancelScheduledValues(time);
  }

  public setValueAtTime(value: number, time: number) {
    this.signal.setValueAtTime(value, time);
  }

  public dispose() {
    this.signal.dispose();
  }

}
