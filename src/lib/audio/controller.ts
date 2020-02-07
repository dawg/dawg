import Tone from 'tone';
import { TransportTime, Ticks, Beat } from '@/lib/audio/types';
import { Transport } from '@/lib/audio/transport';
import { Signal } from '@/lib/audio';
import * as Audio from '@/lib/audio';

interface IAutomationEvent {
  time: Audio.Beat;
  value: number;
  type: Tone.AutomationType;
}

export class AutomationEvent implements IAutomationEvent {
  public static eventId = 0;

  public time: Audio.Beat;
  public value: number;
  public type: Tone.AutomationType;
  public id = '' + AutomationEvent.eventId++;

  constructor(o: IAutomationEvent) {
    this.time = o.time;
    this.value = o.value;
    this.type = o.type;
  }
}

export class Controller extends Tone.Signal {
  private lastValue: number;
  private output: Signal;
  private scheduledEvents: { [id: string]: AutomationEvent } = {};
  // tslint:disable-next-line:variable-name
  private _events: Tone.Timeline<AutomationEvent>;

  constructor(signal: Signal) {
    super();

    // The real output
    this.output = signal;

    this.lastValue = this.value;

    // This overrides the parent _events which doesn't use AutomationEvent
    // We only really need to do this because of TypeScript
    this._events = new Tone.Timeline<AutomationEvent>();
    this._events.memory = Infinity;
  }

  public sync(transport: Transport, time: Ticks, duration: Ticks) {
    const onEndAndStart = ({ seconds }: { seconds: number }) => {
      const val = this.getValueAtTime(transport.seconds);
      this.lastValue = val;
      this.output.cancelScheduledValues(seconds);
      this.output.setValueAtTime(val, seconds);
    };

    return transport.schedule({
      time,
      duration,
      onTick: this.onTick.bind(this),
      onStart: onEndAndStart,
      onEnd: onEndAndStart,
      offset: 0,
    });
  }

  public onTick({ seconds, ticks }: { seconds: number, ticks: number }) {
    const val = this.getValueAtTime(`${ticks}i`);
    if (this.lastValue !== val) {
      this.lastValue = val;
      // approximate ramp curves with linear ramps
      this.output.linearRampToValueAtTime(val, seconds);
      this.output.value = val;
    }
  }

  public add(time: Beat, value: number) {
    const event = new AutomationEvent({
      time: Audio.Context.beatsToTicks(time),
      value,
      type: 'linearRampToValueAtTime',
    });
    return this.addEvent(event);
  }

  public change(eventId: string, value: number) {
    if (this.scheduledEvents.hasOwnProperty(eventId)) {
      const event = this.scheduledEvents[eventId];
      event.value = value;
    }
    return this;
  }

  public setTime(eventId: string, time: Audio.Beat) {
    if (this.scheduledEvents.hasOwnProperty(eventId)) {
      const event = this.scheduledEvents[eventId];
      event.time = time;
    }
    return this;
  }

  public remove(eventId: string) {
    if (this.scheduledEvents.hasOwnProperty(eventId)) {
      const event = this.scheduledEvents[eventId];
      this._events.remove(event);
      // event.dispose();
      delete this.scheduledEvents[eventId];
    }
    return this;
  }

  public dispose() {
    this._events.cancel(0);
    super.dispose.call(this);
    return this;
  }

  private anchorValue(time: number) {
    // FIXME this whole file IDK and get rid of Tone.Transport
    const val = this.getValueAtTime(Tone.Transport.seconds);
    this.lastValue = val;
    this.output.cancelScheduledValues(time);
    this.output.setValueAtTime(val, time);
  }

  private addEvent(event: AutomationEvent) {
    this._events.add(event);
    this.scheduledEvents[event.id.toString()] = event;
    return event.id;
  }
}
