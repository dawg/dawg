import path from 'path';
import * as t from '@/lib/io';
import uuid from 'uuid';
import * as Audio from '@/lib/audio';
import { Serializable } from '@/models/serializable';
import { BuildingBlock } from '@/models/block';
import * as oly from '@/lib/olyger';
import { GraphNode } from '@/models/node';
import { Disposer } from '@/lib/std';

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
  public readonly player: GraphNode<Audio.ObeoPlayer>;
  public readonly name: oly.OlyRef<string>;

  constructor(public buffer: AudioBuffer | null, i: ISample) {
    this.id = i.id;
    this.path = i.path;
    this.name = oly.olyRef(i.name, 'Sample Name');
    this.player = new GraphNode(
      Audio.createPlayer(buffer),
      'Sample',
    ).toDestination();
  }

  get beats() {
    if (this.buffer) {
      const minutes = this.buffer.length / this.buffer.sampleRate / 60;
      return Audio.context.round(minutes * Audio.context.BPM.value);
    } else {
      return 0;
    }
  }

  public preview(
    opts?: { onended: () => void },
  ): Disposer {
    const source = this.player.node.start(opts);
    return {
      dispose: () => {
        try {
          source.stop();
        } catch (e) {
          // Already stopped
        }
      },
    };
  }

  public serialize() {
    return {
      id: this.id,
      path: this.path,
      name: this.name.value,
    };
  }
}
