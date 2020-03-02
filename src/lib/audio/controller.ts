import Tone from 'tone';
import { Ticks, Beat } from '@/lib/audio/types';
import { Transport } from '@/lib/audio/transport';
import { Signal } from '@/lib/audio';
import * as Audio from '@/lib/audio';
import { Disposer } from '@/lib/std';

interface IAutomationEvent {
  time: Audio.Beat;
  value: number;
  type: Tone.AutomationType;
}

export interface PointController {
  setValue: (value: number) => void;
  setTime: (time: number) => void;
  remove: () => Disposer;
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
      // approximate curves with linear ramps
      this.output.linearRampToValueAtTime(val, seconds);
      this.output.value = val;
    }
  }

  public add(time: Beat, value: number): PointController {
    const event = new AutomationEvent({
      time: Audio.Context.beatsToTicks(time),
      value,
      type: 'linearRampToValueAtTime',
    });

    this._events.add(event);
    this.scheduledEvents[event.id.toString()] = event;

    return {
      setValue: (newValue: number) => {
        event.value = newValue;
      },
      setTime: (newTime: number) => {
        event.time = newTime;
      },
      remove: () => {
        return this.remove(event.id);
      },
    };
  }

  public dispose() {
    this._events.cancel(0);
    super.dispose.call(this);
    return this;
  }

  private remove(eventId: string) {
    const event = this.scheduledEvents[eventId];
    this._events.remove(event);
    delete this.scheduledEvents[eventId];

    return {
      dispose: () => {
        this._events.add(event);
        this.scheduledEvents[eventId] = event;
      },
    };
  }
}
