import path from 'path';
import * as t from '@/lib/io';
import uuid from 'uuid';
import * as Audio from '@/lib/audio';
import { Serializable } from '@/models/serializable';
import { Context } from '@/lib/audio/context';
import { BuildingBlock } from '@/models/block';
import { GraphNode } from '@/node';
import * as oly from '@/lib/olyger';

export const SampleType = t.type({
  id: t.string,
  path: t.string,
  name: t.string,
});

export type ISample = t.TypeOf<typeof SampleType>;

export class Sample implements BuildingBlock, Serializable<ISample> {
  public static create(samplePath: string, buffer: AudioBuffer) {
    return new Sample(buffer, {
      id: uuid.v4(),
      path: samplePath,
      name: path.basename(samplePath),
    });
  }

  public readonly id: string;
  public readonly path: string;
  public readonly player: GraphNode<Audio.Player | null>;
  public readonly name: oly.OlyRef<string>;

  constructor(public buffer: AudioBuffer | null, i: ISample) {
    this.id = i.id;
    this.path = i.path;
    this.name = oly.olyRef(i.name);
    this.player = new GraphNode(
      buffer ? new Audio.Player(buffer) : null,
      'Sample',
    ).toMaster();
  }

  get beats() {
    if (this.buffer) {
      const minutes = this.buffer.length / this.buffer.sampleRate / 60;
      return Context.round(minutes * Context.BPM);
    } else {
      return 0;
    }
  }

  public preview(opts?: { onended: () => void }): { started: true, dispose: () => void } | { started: false } {
    if (this.player.node) {
      const source = this.player.node.preview(opts);
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
      name: this.name.value,
    };
  }
}
