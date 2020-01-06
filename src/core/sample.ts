import Tone from 'tone';
import path from 'path';
import * as t from '@/modules/io';
import uuid from 'uuid';
import * as Audio from '@/modules/audio';
import { Serializable } from '@/core/serializable';
import { disposeHelp } from '@/utils';
import { Context } from '@/modules/audio/context';

export const SampleType = t.type({
  id: t.string,
  path: t.string,
});

export type ISample = t.TypeOf<typeof SampleType>;

export class Sample implements Serializable<ISample> {
  public static create(samplePath: string, buffer: AudioBuffer) {
    return new Sample(buffer, {
      id: uuid.v4(),
      path: samplePath,
    });
  }

  public id: string;
  public path: string;
  public player: Audio.Player | null = null;
  private previewSource: Tone.BufferSource | null = null;

  constructor(public buffer: AudioBuffer | null, i: ISample) {
    this.id = i.id;
    this.path = i.path;
    if (buffer) {
      this.player = new Audio.Player(buffer).toMaster();
    }
  }

  get beats() {
    if (this.buffer) {
      const minutes = this.buffer.length / this.buffer.sampleRate / 60;
      return minutes * Context.BPM.value;
    } else {
      return 0;
    }
  }

  get name() {
    return path.basename(this.path);
  }

  public preview(opts?: { onended: () => void }): { started: true, dispose: () => void } | { started: false } {
    if (this.player) {
      const source = this.player.preview(opts);
      return {
        started: true,
        dispose: () => {
          try {
            source.stop();
          } catch (e) {
            // Already stopped
          }
        },
      };
    } else {
      return {
        started: false,
      };
    }
  }

  public serialize() {
    return {
      id: this.id,
      path: this.path,
    };
  }
}
