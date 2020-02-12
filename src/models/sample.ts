import path from 'path';
import * as t from '@/lib/io';
import uuid from 'uuid';
import * as Audio from '@/lib/audio';
import { Serializable } from '@/models/serializable';
import { Context } from '@/lib/audio/context';

export const SampleType = t.type({
  id: t.string,
  path: t.string,
});

export type ISample = t.TypeOf<typeof SampleType>;

interface BuildingBlockOptions<T extends t.Mixed, V extends any[]>  {
  type: T;
  create: (...args: V) => void;
}

const createBuildingBlock = <T extends t.Mixed, V extends any[]>(opts: BuildingBlockOptions<T, V>) => {
  //
};

export const createSample = createBuildingBlock({
  type: SampleType,
  create: () => {
    //
  },
});

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
      return Context.round(minutes * Context.BPM.value);
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
