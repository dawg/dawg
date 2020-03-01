import Tone from 'tone';
import { Ticks, Beat } from '@/lib/audio/types';
import { emitter } from '@/lib/events';

class Ticker {
  private worker: Worker;

  constructor(callback: () => void, updateInterval: number) {
    const blob = new Blob([
      // the initial timeout time
      'var timeoutTime = ' + (updateInterval * 1000).toFixed(1) + ';' +
      // onmessage callback
      'self.onmessage = function(msg){' +
      '	timeoutTime = parseInt(msg.data);' +
      '};' +
      // the tick function which posts a message
      // and schedules a new tick
      'function tick(){' +
      '	setTimeout(tick, timeoutTime);' +
      '	self.postMessage(\'tick\');' +
      '}' +
      // call tick initially
      'tick();',
    ]);

    const blobUrl = URL.createObjectURL(blob);
    this.worker = new Worker(blobUrl);

    this.worker.onmessage = callback;
  }

  public dispose() {
    this.worker.terminate();
  }
}

const events = emitter<{ tick: [] }>();
const ticker = new Ticker(() => events.emit('tick'), 0.03); // updateInterval FIXME

const cEvents = emitter<{ setBPM: [number] }>();

export const context = (Tone.context as any)._context as unknown as AudioContext;
export class Context {
  public static context = context;
  public static PPQ = 192;
  public static lookAhead = 0.1;

  public static get BPM() {
    return Context._BPM;
  }

  public static set BPM(value: number) {
    Context._BPM = value;
    cEvents.emit('setBPM', value);
  }

  public static onDidSetBPM(cb: (bpm: number) => void) {
    return cEvents.on('setBPM', cb);
  }

  public static ticksToSeconds(ticks: Ticks) {
    return (ticks / Context.PPQ) / Context.BPM * 60;
  }

  /**
   * Round to the nearest precision.
   *
   * @param beats The beats.
   * @returns The rounded beats.
   */
  public static round(beats: Beat) {
    return Math.round(beats * Context.PPQ) / Context.PPQ;
  }

  public static beatsToTicks(beat: Beat) {
    // FIXME is ceil right?
    return Math.ceil(beat * Context.PPQ);
  }

  public static beatsToSeconds(beat: Beat) {
    return beat / Context.BPM * 60;
  }

  public static onDidTick(f: () => void) {
    events.on('tick', f);
    return {
      dispose: () => {
        events.off('tick', f);
      },
    };
  }

  public static now() {
    return context.currentTime + Context.lookAhead;
  }

  public static sampleTime() {
    return 1 / context.sampleRate;
  }

  public static resume() {
    context.resume();
  }

  public static dispose() {
    events.removeAllListeners();
    ticker.dispose();
  }

  private static _BPM = 120;

  private constructor() {}
}
