import * as t from '@/lib/io';
import uuid from 'uuid';
import * as Audio from '@/lib/audio';
import { Serializable } from '@/models/serializable';
import { Score, ScoreType } from '@/models/score';
import { BuildingBlock } from '@/models/block';
import * as oly from '@/lib/olyger';

export const PatternType = t.type({
  id: t.string,
  name: t.string,
  scores: t.array(ScoreType),
});

export type IPattern = t.TypeOf<typeof PatternType>;

export class Pattern implements BuildingBlock, Serializable<IPattern> {
  public static create(name: string) {
    return new Pattern({ name, id: uuid.v4(), scores: [] }, new Audio.Transport(), []);
  }

  public readonly id: string;
  public readonly name: oly.OlyRef<string>;

  constructor(i: IPattern, public transport: Audio.Transport, public scores: Score[]) {
    this.id = i.id;
    this.name = oly.olyRef(i.name);
    const olyScores = oly.olyArr(scores);

    olyScores.onDidRemove(({ items, subscriptions }) => {
      items.map((score) => {
        subscriptions.push({
          execute: () => {
            const disposers = score.notes.map((note) => note.remove());
            return {
              undo: () => {
                disposers.forEach((disposer) => disposer.dispose());
              },
            };
          },
        });
      });
    });

    this.scores = scores;
  }

  public serialize() {
    return {
      name: this.name.value,
      id: this.id,
      scores: this.scores.map((score) => score.serialize()),
    };
  }
}
