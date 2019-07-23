import Tone from 'tone';
import { Time, TransportTime } from '@/modules/audio/types';
import Transport from '@/modules/audio/transport';

interface Event {
  state: Tone.TransportState;
  time: Tone.Time;
  duration: Time;
  offset?: Time;
}

export abstract class Source extends Tone.AudioNode {
  public volume: Tone.Signal;
  protected output: Tone.AudioNode;
  // tslint:disable-next-line:variable-name
  protected _state = new Tone.TimelineState<Event>('stopped');
  // tslint:disable-next-line:variable-name
  private _volume: Tone.Volume;
  private scheduled: string[] = [];
  private syncedTransport: Transport | null = null;

  constructor(options: { volume?: number, mute?: boolean } = {}) {
    super();

    this._volume = this.output = new Tone.Volume(options.volume || 0);


    this.volume = this._volume.volume;
    this._state.memory = 100;

    // @ts-ignore
    this._volume.output.output.channelCount = 2;
    // @ts-ignore
    this._volume.output.output.channelCountMode = 'explicit';

    this.mute = options.mute || false;
  }

  get synced() {
    return !!this.syncedTransport;
  }

  get state(): Tone.TransportState {
    if (this.syncedTransport) {
      if (this.syncedTransport.state === 'started') {
        return this._state.getValueAtTime(this.syncedTransport.seconds);
      } else {
        return 'stopped';
      }
    } else {
      return this._state.getValueAtTime(Tone.Transport.context.now());
    }
  }

  get mute() {
    return this._volume.mute;
  }

  set mute(mute: boolean) {
    this._volume.mute = mute;
  }

  public abstract _start(startTime?: Time, offset?: Time, duration?: Time): this;
  public abstract _stop(time?: Time): this;

  public restart(startTime?: Time, offset?: Time, duration?: Time) {
    this._stop(startTime);
    this._start(startTime, offset, duration);
    return this;
  }

  public sync(transport: Transport, time: TransportTime, offset: Time, duration: Time) {
    this.syncedTransport = transport;

    transport.on('start', this.syncedStart.bind(this));
    transport.on('loopStart', this.syncedStart.bind(this));
    transport.on('stop', this.syncedStop.bind(this));
    transport.on('pause', this.syncedStop.bind(this));
    transport.on('loopEnd', this.syncedStop.bind(this));

    time = this.toSeconds(time);

    // I removed some code here that I thought was unnecessary
    // I haven't seen any repercussions

    this._state.setStateAtTime('started', time);

    // add the offset time to the event
    const event = this._state.get(time);
    event.offset = offset || 0;
    event.duration = duration;

    const id = this.syncedTransport.schedule((t: number) => {
      this._start(t, event.offset, event.duration);
    }, time);
    this.scheduled.push(id);

    // if it's already started
    if (this.syncedTransport.state === 'started') {
      this.syncedStart(Tone.Transport.context.now(), this.syncedTransport.seconds);
    }

    return id;
  }

  public stop(time?: Time) {
    if (time === undefined && this.syncedTransport) {
      time = this.syncedTransport.seconds;
    } else {
      time = this.toSeconds(time);
    }
    if (!this.syncedTransport) {
      this._stop(time);
    } else {
      const sched = this.syncedTransport.schedule(this._stop.bind(this), time);
      this.scheduled.push(sched);
    }
    this._state.cancel(time);
    this._state.setStateAtTime('stopped', time);
    return this;
  }

  public syncedStart(time: number, offset?: number) {
    if (offset === undefined) {
      return;
    }

    if (offset > 0) {
      // get the playback state at that time
      const stateEvent = this._state.get(offset);
      // listen for start events which may occur in the middle of the sync'ed time
      if (stateEvent && stateEvent.state === 'started' && stateEvent.time.valueOf() !== offset) {
        // get the offset
        const startOffset = offset - this.toSeconds(stateEvent.time);
        let duration;
        if (stateEvent.duration) {
          duration = this.toSeconds(stateEvent.duration) - startOffset;
        }
        this._start(time, this.toSeconds(stateEvent.offset) + startOffset, duration);
      }
    }
  }

  public syncedStop(time: number) {
    if (!this.syncedTransport) {
      return;
    }

    const t = Math.max(time - this.sampleTime, 0);
    const seconds = this.syncedTransport.getSecondsAtTime(t);
    if (this._state.getValueAtTime(seconds) === 'started') {
      this._stop(time);
    }
  }

  public unsync() {
    if (!this.syncedTransport) {
      return;
    }

    this.syncedTransport.on('start', this.syncedStart.bind(this));
    this.syncedTransport.on('loopStart', this.syncedStart.bind(this));
    this.syncedTransport.on('stop', this.syncedStop.bind(this));
    this.syncedTransport.on('pause', this.syncedStop.bind(this));
    this.syncedTransport.on('loopEnd', this.syncedStop.bind(this));

    for (const id of this.scheduled) {
      this.syncedTransport.clear(id);
    }

    this.scheduled = [];
    this.syncedTransport = null;
    this._state.cancel(0);
    return this;
  }

  public setDuration(duration: Time) {
    this._state.forEach((event) => {
      event.duration = duration;
    });
  }

  public dispose() {
    super.dispose();
    this.unsync();
    this.scheduled = [];
    this._volume.dispose();
    this._state.dispose();
  }
}
