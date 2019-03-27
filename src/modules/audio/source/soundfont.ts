import Tone from 'tone';
import { Time, ContextTime } from '@/modules/audio/types';
import { Source } from '@/modules/audio/source/source';
import { context } from '@/modules/audio/context';
import * as soundfonts from 'soundfont-player';


// tslint:disable-next-line:no-empty-interface
export interface SoundfontOptions {
  // No options yet
}

/**
 * A soundfont source. Uses `soundfont-player` under the hood.
 */
export class Soundfont implements Source<SoundfontOptions> {
  public static async load(name: soundfonts.InstrumentName) {
    try {
      return new Soundfont(await soundfonts.instrument(context, name));
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.warn(e.message);
      return null;
    }
  }

  constructor(private player: soundfonts.Player) {}

  public triggerAttackRelease(note: string, duration: Time, time: ContextTime, velocity?: number) {
    const durationSeconds = new Tone.TransportTime(duration).toSeconds();
    this.player.play(note, time, {
      duration: durationSeconds,
      gain: velocity,
    });
    return this;
  }

  public triggerAttack(note: string): this {
    this.player.play(note);
    return this;
  }

  public triggerRelease(note: string): this {
    this.player.stop();
    return this;
  }

  public connect(node: Tone.AudioNode): this {
    // @ts-ignore
    // TODO A bit of a hacky solution to make Tone.js work with soundfonts
    this.player.connect(node.output);
    return this;
  }

  public disconnect(node: Tone.AudioNode) {
    // We can't disconnect right now
    // That option isn't available to us
    return this;
  }

  public set<K extends keyof SoundfontOptions>(o: { key: K, value: SoundfontOptions[K] }) {
    this[o.key] = o.value;
  }
}
