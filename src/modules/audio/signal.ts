import Tone from 'tone';
import { TransportTime } from './types';
import Transport from '@/modules/audio/transport';

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

export class TransportTimelineSignal extends Tone.Signal {
  private lastValue: number;
  private output: Tone.Signal;
  private callback: (time: number) => void;
  private scheduledEvents: { [id: string]: AutomationEvent } = {};
  // tslint:disable-next-line:variable-name
  private _events: Tone.Timeline<AutomationEvent>;

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

    // This overrides the parent _events which doesn't use AutomationEvent
    this._events = new Tone.Timeline<AutomationEvent>();
    this._events.memory = Infinity;
  }

  public sync(transport: Transport<any>, time: TransportTime) {
    transport.on('start', this.callback).on('stop', this.callback).on('pause', this.callback);
    // TODO(jacob) duration
    return transport.scheduleRepeat(this.onTick.bind(this), '1i', time);
  }

  public onTick(time: number, ticks: number) {
    const val = this.getValueAtTime(`${ticks}i`);
    if (this.lastValue !== val) {
      this.lastValue = val;
      // approximate ramp curves with linear ramps
      this.output.linearRampToValueAtTime(val, time);
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

  public _anchorValue(time: number) {
    const val = this.getValueAtTime(Tone.Transport.seconds);
    this.lastValue = val;
    this.output.cancelScheduledValues(time);
    this.output.setValueAtTime(val, time);
  }

  public dispose() {
    // this.transport.clear(this.synced);
    // this.transport.off('start', this.callback).off('stop', this.callback).off('pause', this.callback);
    this._events.cancel(0);
    super.dispose.call(this);
    this.output.dispose();
    return this;
  }

  private addEvent(event: AutomationEvent) {
    this._events.add(event);
    this.scheduledEvents[event.id.toString()] = event;
    return event.id;
  }
}
