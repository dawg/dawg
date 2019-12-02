import Tone from 'tone';
import path from 'path';
import * as t from 'io-ts';
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

  public preview() {
    if (this.player) {
      this.previewSource = this.player.preview();
    }
  }

  public stopPreview() {
    if (this.previewSource) {
      try {
        this.previewSource.stop();
      } catch (e) {
        // DO nothing
        // BufferSource will throw an error if it is already stopped
      }
    }
  }

  public dispose() {
    if (this.player) {
      disposeHelp(this.player);
    }
  }

  public serialize() {
    return {
      id: this.id,
      path: this.path,
    };
  }
}
