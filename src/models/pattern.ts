import * as t from '@/lib/io';
import uuid from 'uuid';
import * as Audio from '@/lib/audio';
import { Serializable } from '@/models/serializable';
import { Score, ScoreType } from '@/models/score';
import { BuildingBlock } from '@/models/block';

export const PatternType = t.type({
  id: t.string,
  name: t.string,
  scores: t.array(ScoreType),
});

export type IPattern = t.TypeOf<typeof PatternType>;

export class Pattern extends BuildingBlock implements Serializable<IPattern> {
  public static create(name: string) {
    return new Pattern({ name, id: uuid.v4(), scores: [] }, new Audio.Transport(), []);
  }
  public id: string;
  public name: string;

  constructor(i: IPattern, public transport: Audio.Transport, public scores: Score[]) {
    super();
    this.id = i.id;
    this.name = i.name;
    this.scores = scores;
  }

  public serialize() {
    return {
      name: this.name,
      id: this.id,
      scores: this.scores.map((score) => score.serialize()),
    };
  }
}
