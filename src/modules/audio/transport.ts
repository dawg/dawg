import Tone, { _TimeArg } from 'tone';

export default class Transport extends Tone.Emitter {
  public loop = false;
  public bpm: Tone.TickSignal;
  public _syncedSignals = [];
  private _loopStart = 0;
  private _loopEnd = 0;
  private _clock: Tone.Clock;
  private _swingAmount = 0;

  private defaults = {
    bpm : 120,
    swing : 0,
    swingSubdivision : '8n',
    timeSignature : 4,
    loopStart : 0,
    loopEnd : '4m',
    PPQ : 192,
  };

  private _swingTicks = this.defaults.PPQ / 2; // 8n
  private _repeatedEvents = new Tone.IntervalTimeline();
  private _ppq = this.defaults.PPQ;
  private _timeline = new Tone.Timeline();
  private isTransport = true;
  private _scheduledEvents: {[k: string]: {event: Tone.TransportEvent, timeline: Tone.Timeline}} = {};
  private _timeSignature = this.defaults.timeSignature;

  constructor() {
    super();
    this.loop = false;
    this._loopStart = 0;
    this._loopEnd = 0;

    this._clock = new Tone.Clock({
      callback: this._processTick.bind(this),
      frequency: 0,
    });

    // Tone.Emitter.call(this);
    // Tone.getContext(function(){

    this._bindClockEvents();
    this.bpm = this._clock.frequency;
    // this.bpm._toUnits = this._toUnits.bind(this);
    // this.bpm._fromUnits = this._fromUnits.bind(this);
    this.bpm.units = Tone.Type.BPM;
    this.bpm.value = this.bpm;
    this._readOnly('bpm');
    // this.context.transport = this;
  }

  public _processTick(tickTime: number, ticks: number) {
    // handle swing
    if (this._swingAmount > 0 &&
      ticks % this._ppq !== 0 && // not on a downbeat
      ticks % (this._swingTicks * 2) !== 0) {
      // add some swing
      const progress = (ticks % (this._swingTicks * 2)) / (this._swingTicks * 2);
      const amount = Math.sin((progress) * Math.PI) * this._swingAmount;
      tickTime += new Tone.Ticks(this._swingTicks * 2 / 3).toSeconds() * amount;
    }
    // do the loop test
    if (this.loop) {
      if (ticks >= this._loopEnd) {
        this.emit('loopEnd', tickTime);
        this._clock.setTicksAtTime(this._loopStart, tickTime);
        ticks = this._loopStart;
        this.emit('loopStart', tickTime, this._clock.getSecondsAtTime(tickTime));
        this.emit('loop', tickTime);
      }
    }
    // invoke the timeline events scheduled on this tick
    this._timeline.forEachAtTime(ticks, (event) => {
      event.invoke(tickTime);
    });
  }

  public schedule(callback: (time: number) => void, time: number) {
    const event = new Tone.TransportEvent(null, {
      time: new Tone.TransportTime(time),
      callback,
    });
    return this._addEvent(event, this._timeline);
  }

  // public scheduleRepeat(callback, interval, startTime, duration) {
  //   const event = new Tone.TransportRepeatEvent(this, {
  //     callback,
  //     interval : Tone.Time(interval),
  //     time : Tone.TransportTime(startTime),
  //     duration : Tone.Time(Tone.defaultArg(duration, Infinity)),
  //   });
  //   // kick it off if the Transport is started
  //   return this._addEvent(event, this._repeatedEvents);
  // }

  // public scheduleOnce(callback, time) {
  //   const event = new Tone.TransportEvent(this, {
  //     time : Tone.TransportTime(time),
  //     callback,
  //     once : true,
  //   });
  //   return this._addEvent(event, this._timeline);
  // }

  public clear(eventId: string) {
    if (this._scheduledEvents.hasOwnProperty(eventId)) {
      const item = this._scheduledEvents[eventId.toString()];
      item.timeline.remove(item.event);
      item.event.dispose();
      delete this._scheduledEvents[eventId.toString()];
    }
    return this;
  }


  public _addEvent(event: Tone.TransportEvent, timeline: Tone.Timeline) {
    this._scheduledEvents[event.id.toString()] = {
      event,
      timeline,
    };
    timeline.add(event);
    return event.id;
  }

  public cancel(after = 0) {
    after = this.toTicks(after);
    this._timeline.forEachFrom(after, (event) => {
      this.clear(event.id);
    });
    // this._repeatedEvents.forEachFrom(after, (event) => {
    //   this.clear(event.id);
    // });
    return this;
  }

  public _bindClockEvents() {
    this._clock.on('start', (time: number, offset: number) => {
      offset = new Tone.Ticks(offset).toSeconds();
      this.emit('start', time, offset);
    });

    this._clock.on('stop', (time) => {
      this.emit('stop', time);
    });

    this._clock.on('pause', (time) => {
      this.emit('pause', time);
    });
  }

  get state() {
    return this._clock.getStateAtTime(Transport.now());
  }

  public start(time?: number, offset?: number) {
    // start the clock
    if (Transport.isDefined(offset)) {
      offset = this.toTicks(offset!);
    }
    this._clock.start(time, offset);
    return this;
  }


  public stop(time: number) {
    this._clock.stop(time);
    return this;
  }


  public pause(time: number) {
    this._clock.pause(time);
    return this;
  }

  public toggle(time?: PrimitiveTime) {
    time = this.toSeconds(time);
    if (this._clock.getStateAtTime(time) !== 'started') {
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
    const ticks = this._clock.getTicksAtTime(now);
    return new Tone.Ticks(ticks).toBarsBeatsSixteenths();
  }
  set position(progress) {
    const ticks = this.toTicks(progress);
    this.ticks = ticks;
  }

  get seconds() {
    return this._clock.seconds;
  }
  set seconds(s: number) {
    const now = Transport.now();
    const ticks = this.bpm.timeToTicks(s, now);
    this.ticks = ticks.toTicks();
  }

  get progress() {
    if (this.loop) {
      const now = Transport.now();
      const ticks = this._clock.getTicksAtTime(now);
      return (ticks - this._loopStart) / (this._loopEnd - this._loopStart);
    } else {
      return 0;
    }
  }

  get ticks() {
    return this._clock.ticks;
  }
  set ticks(t: number) {
    if (this._clock.ticks !== t) {
      const now = Transport.now();
      // stop everything synced to the transport
      if (this.state === 'started') {
        this.emit('stop', now);
        this._clock.setTicksAtTime(t, now);
        // restart it with the new time
        this.emit('start', now, this.seconds);
      } else {
        this._clock.setTicksAtTime(t, now);
      }
    }
  }


// Object.defineProperty(Tone.Transport.prototype, 'ticks', {
//     ,
//   });

// Tone.Transport.prototype.getTicksAtTime(time) {
//     return Math.round(this._clock.getTicksAtTime(time));
//   };

// Tone.Transport.prototype.getSecondsAtTime(time) {
//     return this._clock.getSecondsAtTime(time);
//   };

// Object.defineProperty(Tone.Transport.prototype, 'PPQ', {
//     get() {
//       return this._ppq;
//     },
//     set(ppq) {
//       const bpm = this.bpm.value;
//       this._ppq = ppq;
//       this.bpm.value = bpm;
//     },
//   });

// Tone.Transport.prototype._fromUnits(bpm) {
//     return 1 / (60 / bpm / this.PPQ);
//   };

// Tone.Transport.prototype._toUnits(freq) {
//     return (freq / this.PPQ) * 60;
//   };

// Tone.Transport.prototype.nextSubdivision(subdivision) {
//     subdivision = this.toTicks(subdivision);
//     if (this.state !== Tone.State.Started) {
//       // if the transport's not started, return 0
//       return 0;
//     } else {
//       const now = this.now();
//       // the remainder of the current ticks and the subdivision
//       const transportPos = this.getTicksAtTime(now);
//       const remainingTicks = subdivision - transportPos % subdivision;
//       return this._clock.nextTickTime(remainingTicks, now);
//     }
//   };

// Tone.Transport.prototype.syncSignal(signal, ratio) {
//     if (!ratio) {
//       // get the sync ratio
//       const now = this.now();
//       if (signal.getValueAtTime(now) !== 0) {
//         ratio = signal.getValueAtTime(now) / this.bpm.getValueAtTime(now);
//       } else {
//         ratio = 0;
//       }
//     }
//     const ratioSignal = new Tone.Gain(ratio);
//     this.bpm.chain(ratioSignal, signal._param);
//     this._syncedSignals.push({
//       ratio : ratioSignal,
//       signal,
//       initial : signal.value,
//     });
//     signal.value = 0;
//     return this;
//   };

//   /**
// 	 *  Unsyncs a previously synced signal from the transport's control.
// 	 *  See Tone.Transport.syncSignal.
// 	 *  @param  {Tone.Signal} signal
// 	 *  @returns {Tone.Transport} this
// 	 */
// Tone.Transport.prototype.unsyncSignal(signal) {
//     for (let i = this._syncedSignals.length - 1; i >= 0; i--) {
//       const syncedSignal = this._syncedSignals[i];
//       if (syncedSignal.signal === signal) {
//         syncedSignal.ratio.dispose();
//         syncedSignal.signal.value = syncedSignal.initial;
//         this._syncedSignals.splice(i, 1);
//       }
//     }
//     return this;
//   };

//   public dispose() {
//     Tone.Emitter.prototype.dispose.call(this);
//     this._clock.dispose();
//     this._clock = null;
//     this._writable('bpm');
//     this.bpm = null;
//     this._timeline.dispose();
//     this._timeline = null;
//     this._repeatedEvents.dispose();
//     this._repeatedEvents = null;
//     return this;
//   }

  ///////////////////////////////////////////////////////////////////////////////
  // 	INITIALIZATION
  ///////////////////////////////////////////////////////////////////////////////

  // Tone.Context.on("init", function(context){
  // 	if (context.transport && context.transport.isTransport){
  // 		Tone.Transport = context.transport;
  // 	} else {
  // 		Tone.Transport = new TransportConstructor();
  // 	}
  // });

  // Tone.Context.on("close", function(context){
  // 	if (context.transport && context.transport.isTransport){
  // 		context.transport.dispose();
  // 	}
  // });
}
