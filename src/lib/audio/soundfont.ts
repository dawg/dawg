import Tone from 'tone';
import { ContextTime, Seconds } from '@/lib/audio/types';
import { Source } from '@/lib/audio/source';
import { context } from '@/lib/audio/context';
import * as soundfonts from '@/lib/soundfont';

// tslint:disable-next-line:no-empty-interface
export interface SoundfontOptions {
  // No options yet
}

/**
 * A soundfont source.
 */
export class Soundfont implements Source<SoundfontOptions> {
  private player: soundfonts.Player | null = null;
  private queue: Tone.AudioNode[] = [];

  constructor(private name: soundfonts.SoundfontName) {
    this.attemptReloadIfNecessary();
  }

  public triggerAttackRelease(note: string, duration: Seconds, time: ContextTime, velocity?: number) {
    if (this.player === null) {
      return this;
    }

    this.player.start(note, time, {
      duration,
      gain: velocity,
    });

    return this;
  }

  public triggerAttack(note: string, time?: Seconds, velocity?: number) {
    if (this.player === null) {
      return {
        dispose: () => {
          //
        },
      };
    }

    return this.player.start(note, time, { gain: velocity });
  }

  public connect(node: Tone.AudioNode): this {
    if (this.player === null) {
      this.queue.push(node);
      return this;
    }

    // A bit of a hacky solution to make Tone.js work with soundfonts
    this.player.connect((node as any).output as AudioNode);
    return this;
  }

  public disconnect(node: Tone.AudioNode) {
    if (this.player === null) {
      return this;
    }

    // FIXME A bit of a hacky solution to make Tone.js work with soundfonts
    this.player.disconnect((node as any).output as AudioNode);
    return this;
  }

  public set<K extends keyof SoundfontOptions>(o: { key: K, value: SoundfontOptions[K] }) {
    this[o.key] = o.value;
  }

  public attemptReloadIfNecessary() {
    if (this.player === null) {
      const promise = soundfonts.instrument(context, this.name);

      promise.then((result) => {
        if (result.type === 'error') {
          // TODO
          // tslint:disable-next-line:no-console
          console.warn(result);
        } else {
          this.player = result.soundfont;

          this.queue.forEach((node) => {
            this.connect(node);
          });

          this.queue = [];
        }
      });
    }
  }
}
