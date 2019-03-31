import Tone from 'tone';
import { Time, ContextTime } from '@/modules/audio/types';
import { Source } from '@/modules/audio/source/source';
import { Player } from 'soundfont-player';


// tslint:disable-next-line:no-empty-interface
export interface SoundfontOptions {
  // No options yet
}

/**
 * A soundfont source. Uses `soundfont-player` under the hood.
 */
export class Soundfont implements Source<SoundfontOptions> {
  private playingNotes: {[key: string]: Player} = {};

  constructor(private player: Player) {}

  public triggerAttackRelease(note: string, duration: Time, time: ContextTime, velocity?: number) {
    const durationSeconds = new Tone.TransportTime(duration).toSeconds();
    this.player.play(note, time, {
      duration: durationSeconds,
      gain: velocity,
    });
    return this;
  }

  public triggerAttack(note: string, velocity?: number): this {
    this.playingNotes[note] = this.player.play(note, undefined, {gain: velocity});
    return this;
  }

  public triggerRelease(note: string): this {
    if (note in this.playingNotes) {
      this.playingNotes[note].stop();
      delete this.playingNotes[note];
    }
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
