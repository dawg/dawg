import Tone, { TransportEvent } from 'tone';
import { ContextTime, TransportTime } from './types';
import uuid from 'uuid';

type PartCallback = (exact: ContextTime, ticks: number) => void;

class TimelineEvent {
  public id = uuid.v4();
  constructor(public callback: PartCallback) {}
}

interface ScheduledItem {
  time: number; // ticks
  event: TimelineEvent;
}

export default class Part<T> extends Tone.Emitter<{add: [Part<T>, ScheduledItem], remove: [Part<T>, ScheduledItem]}> {
  public loop = true;
  public timeline = new Tone.Timeline<ScheduledItem>();
  private ppq = 192;
  // tslint:disable-next-line:variable-name
  private _loopStart = 0;
  // tslint:disable-next-line:variable-name
  private _loopEnd = 0;
  private clock = new Tone.Clock({
    callback: this.onTick.bind(this),
    frequency: 0,
  });
  private scheduledEvents: { [k: string]: ScheduledItem } = {};
  private groups: Array<[string, T]> = [];

  private parts: { [k: string]: [Part<T>, number[]] } = {};
  private id = uuid.v4();

  constructor() {
    super();
    this.bpm = 120;
  }

  /**
   * Schedule an event.
   */
  public scheduleEvent(callback: PartCallback, ticks: number) {
    const item = this.addEvent({
      time: ticks,
      event: new TimelineEvent(callback),
    });

    return item.event;
  }

  public scheduleEvents(part: Part<T>, ticks: number) {
    part.on('add', this.childSchedule.bind(this));
    part.on('remove', this.childRemove.bind(this));

    if (!(part.id in this.parts)) {
      this.parts[part.id] = [part, []];
    }

    this.parts[part.id][1].push(ticks);

    part.timeline.forEach((item) => this.addEvent({
      event: item.event,
      time: ticks + item.time,
    }));
  }

  public removeEvents(part: Part<T>, ticks: number) {
    const [_, times] = this.parts[part.id];
    const i = times.indexOf(ticks);

    if (i === -1) {
      return;
    }

    times.splice(i, 1);

    if (times.length === 0) {
      delete this.parts[part.id];
    }

    part.timeline.forEach((item) => {
      this.removeAtTime(ticks + item.time, item.event);
    });

    part.off('add', this.childSchedule.bind(this));
    part.off('remove', this.childRemove.bind(this));
  }

  public childSchedule(child: Part<T>, item: ScheduledItem) {
    if (!(child.id in this.parts)) {
      throw Error(`Information about ${child.id} not available`);
    }

    this.parts[child.id][1].forEach((time) => {
      this.addEvent({
        time: item.time + time,
        event: item.event,
      });
    });
  }

  public childRemove(child: Part<T>, childItem: ScheduledItem) {
    const event = childItem.event;
    this.parts[child.id][1].forEach((startTicks) => {
      const ticks = childItem.time + startTicks;
      this.removeAtTime(ticks, event);
    });
  }

  public removeAtTime(ticks: number, event: TimelineEvent) {
    this.timeline.forEachAtTime(ticks, (item) => {
      if (event === item.event) {
        this.timeline.remove(item);
        this.emit('remove', this, item);
      }
    });
  }

  public addEvent(item: ScheduledItem) {
    this.scheduledEvents[item.event.id] = item;
    this.timeline.add(item);
    this.emit('add', this, item);
    return item;
  }

  public add(callback: PartCallback, ticks: number, o: T) {
    const event = this.scheduleEvent(callback, ticks);
    this.groups.push([event.id, o]);
  }

  public remove(o: T) {
    this.groups.forEach(([id, other], i) => {
      if (o === other) {
        this.clear(id);
        this.groups.splice(i, 1);
      }
    });
  }

  public clear(eventId: string) {
    if (eventId in this.scheduledEvents) {
      const event = this.scheduledEvents[eventId];
      this.timeline.remove(event);
      this.emit('remove', this, event);
      delete this.scheduledEvents[eventId];
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

  public onTick(exact: ContextTime, ticks: number) {
    // do the loop test
    if (this.loop) {
      if (ticks >= this._loopEnd) {
        this.clock.setTicksAtTime(this._loopStart, exact);
        ticks = this._loopStart;
      }
    }
    // invoke the timeline events scheduled on this tick
    this.timeline.forEachAtTime(ticks, (item) => {
      item.event.callback(exact, ticks);
    });
  }
}
