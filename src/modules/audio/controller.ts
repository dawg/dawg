import Tone from 'tone';
import { TransportTime } from './types';
import Transport from '@/modules/audio/transport';
import { Signal } from '@/modules/audio';

interface IAutomationEvent {
  time: Tone.Time;
  value: number;
  type: Tone.AutomationType;
}

export class AutomationEvent implements IAutomationEvent {
  public static eventId = 0;

  public time: Tone.Time;
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
  private callback: (time: number) => void;
  private scheduledEvents: { [id: string]: AutomationEvent } = {};
  // tslint:disable-next-line:variable-name
  private _events: Tone.Timeline<AutomationEvent>;

  constructor(signal: Signal) {
    super();

    // The real output
    this.output = signal;

    this.lastValue = this.value;
    this.callback = this.anchorValue.bind(this);

    // This overrides the parent _events which doesn't use AutomationEvent
    // We only really need to do this because of TypeScript
    this._events = new Tone.Timeline<AutomationEvent>();
    this._events.memory = Infinity;
  }

  public sync(transport: Transport, time: TransportTime, duration: TransportTime) {
    transport.on('start', this.callback).on('stop', this.callback).on('pause', this.callback);
    return transport.scheduleRepeat(this.onTick.bind(this), '1i', time, duration);
  }

  public onTick(time: number, ticks: number) {
    const val = this.getValueAtTime(`${ticks}i`);
    if (this.lastValue !== val) {
      this.lastValue = val;
      // approximate ramp curves with linear ramps
      this.output.linearRampToValueAtTime(val, time);
      this.output.value = val;
    }
  }

  public add(time: TransportTime, value: number) {
    const event = new AutomationEvent({
      time: new Tone.Time(time),
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
    // this.transport.clear(this.synced);
    // this.transport.off('start', this.callback).off('stop', this.callback).off('pause', this.callback);
    this._events.cancel(0);
    super.dispose.call(this);
    this.output.dispose();
    return this;
  }

  private anchorValue(time: number) {
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
