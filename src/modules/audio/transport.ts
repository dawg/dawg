import Tone, { _TimeArg } from 'tone';

export default class Transport extends Tone.Emitter {
  public loop = false;
  public bpm: Tone.TickSignal;
  // tslint:disable-next-line:variable-name
  private _loopStart = 0;
  // tslint:disable-next-line:variable-name
  private _loopEnd = 0;
  private clock: Tone.Clock;

  private defaults = {
    bpm : 120,
    swing : 0,
    swingSubdivision : '8n',
    timeSignature : 4,
    loopStart : 0,
    loopEnd : '4m',
    PPQ : 192,
  };

  private ppq = this.defaults.PPQ;
  private timeline = new Tone.Timeline();
  private isTransport = true;
  private scheduledEvents: {[k: string]: {event: Tone.TransportEvent, timeline: Tone.Timeline}} = {};
  // tslint:disable-next-line:variable-name
  private _timeSignature = this.defaults.timeSignature;

  constructor() {
    super();
    this.clock = new Tone.Clock({
      callback: this._processTick.bind(this),
      frequency: 0,
    });

    this._bindClockEvents();
    this.bpm = this.clock.frequency;
    this.bpm.units = Tone.Type.BPM;
    this.bpm.value = this.bpm;
    this._readOnly('bpm');
    // this.context.transport = this;
  }

  public _processTick(tickTime: number, ticks: number) {
    // do the loop test
    if (this.loop) {
      if (ticks >= this._loopEnd) {
        this.emit('loopEnd', tickTime);
        this.clock.setTicksAtTime(this._loopStart, tickTime);
        ticks = this._loopStart;
        this.emit('loopStart', tickTime, this.clock.getSecondsAtTime(tickTime));
        this.emit('loop', tickTime);
      }
    }
    // invoke the timeline events scheduled on this tick
    this.timeline.forEachAtTime(ticks, (event) => {
      event.invoke(tickTime);
    });
  }

  public schedule(callback: (time: number) => void, time: number) {
    const event = new Tone.TransportEvent(null, {
      time: new Tone.TransportTime(time),
      callback,
    });
    return this._addEvent(event, this.timeline);
  }

  public clear(eventId: string) {
    if (this.scheduledEvents.hasOwnProperty(eventId)) {
      const item = this.scheduledEvents[eventId.toString()];
      item.timeline.remove(item.event);
      item.event.dispose();
      delete this.scheduledEvents[eventId.toString()];
    }
    return this;
  }


  public _addEvent(event: Tone.TransportEvent, timeline: Tone.Timeline) {
    this.scheduledEvents[event.id.toString()] = {
      event,
      timeline,
    };
    timeline.add(event);
    return event.id;
  }

  public cancel(after = 0) {
    after = this.toTicks(after);
    this.timeline.forEachFrom(after, (event) => {
      this.clear(event.id);
    });
    return this;
  }

  public _bindClockEvents() {
    this.clock.on('start', (time: number, offset: number) => {
      offset = new Tone.Ticks(offset).toSeconds();
      this.emit('start', time, offset);
    });

    this.clock.on('stop', (time) => {
      this.emit('stop', time);
    });

    this.clock.on('pause', (time) => {
      this.emit('pause', time);
    });
  }

  get state() {
    return this.clock.getStateAtTime(Transport.now());
  }

  public start(time?: number, offset?: number) {
    // start the clock
    if (Transport.isDefined(offset)) {
      offset = this.toTicks(offset!);
    }
    this.clock.start(time, offset);
    return this;
  }


  public stop(time: number) {
    this.clock.stop(time);
    return this;
  }


  public pause(time: number) {
    this.clock.pause(time);
    return this;
  }

  public toggle(time?: PrimitiveTime) {
    time = this.toSeconds(time);
    if (this.clock.getStateAtTime(time) !== 'started') {
      this.start(time);
    } else {
      this.stop(time);
    }
    return this;
  }

  get timeSignature() {
    return this._timeSignature;
  }
  set timeSignature(timeSig: number | [number, number]) {
    if (!(typeof timeSig === 'number')) {
      timeSig = (timeSig[0] / timeSig[1]) * 4;
    }
    this._timeSignature = timeSig;
  }

  get loopStart() {
    return new Tone.Ticks(this._loopStart).toSeconds();
  }
  set loopStart(startPosition) {
    this._loopStart = this.toTicks(startPosition);
  }

  get loopEnd() {
    return new Tone.Ticks(this._loopEnd).toSeconds();
  }
  set loopEnd(endPosition) {
    this._loopEnd = this.toTicks(endPosition);
  }

  get position() {
    const now = Transport.now();
    const ticks = this.clock.getTicksAtTime(now);
    return new Tone.Ticks(ticks).toBarsBeatsSixteenths();
  }
  set position(progress) {
    const ticks = this.toTicks(progress);
    this.ticks = ticks;
  }

  get seconds() {
    return this.clock.seconds;
  }
  set seconds(s: number) {
    const now = Transport.now();
    const ticks = this.bpm.timeToTicks(s, now);
    this.ticks = ticks.toTicks();
  }

  get progress() {
    if (this.loop) {
      const now = Transport.now();
      const ticks = this.clock.getTicksAtTime(now);
      return (ticks - this._loopStart) / (this._loopEnd - this._loopStart);
    } else {
      return 0;
    }
  }

  get ticks() {
    return this.clock.ticks;
  }
  set ticks(t: number) {
    if (this.clock.ticks !== t) {
      const now = Transport.now();
      // stop everything synced to the transport
      if (this.state === 'started') {
        this.emit('stop', now);
        this.clock.setTicksAtTime(t, now);
        // restart it with the new time
        this.emit('start', now, this.seconds);
      } else {
        this.clock.setTicksAtTime(t, now);
      }
    }
  }

  public getTicksAtTime(time: PrimitiveTime) {
    return Math.round(this.clock.getTicksAtTime(time));
  }

  get PPQ() {
    return this.ppq;
  }
  set PPQ(ppq) {
    const bpm = this.bpm.value;
    this.ppq = ppq;
    this.bpm.value = bpm;
  }
}
