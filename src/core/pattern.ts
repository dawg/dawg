import * as t from '@/io';
import uuid from 'uuid';
import * as Audio from '@/audio';
import { Serializable } from '@/core/serializable';
import { Score, ScoreType } from '@/core/score';

const PatternTypeRequired = t.type({
  name: t.string,
  id: t.string,
});

const PatternTypePartial = t.partial({
  scores: t.array(ScoreType),
});

export const PatternType = t.intersection([PatternTypeRequired, PatternTypePartial]);

export type IPattern = t.TypeOf<typeof PatternType>;

export class Pattern implements Serializable<IPattern> {
  public static create(name: string) {
    return new Pattern({ name, id: uuid.v4() }, new Audio.Transport(), []);
  }
  public id: string;
  public name: string;

  constructor(i: IPattern, public transport: Audio.Transport, public scores: Score[]) {
    this.id = i.id;
    this.name = i.name;
    this.scores = scores;

    // FIXME is this the best place
    this.scores.forEach((score) => {
      score.notes.forEach((note) => {
        note.schedule(this.transport);
      });
    });
  }

  get duration() {
    // FIXME 4 is is hardcoded
    return this.scores.reduce((max, score) => {
      return Math.max(max, ...score.notes.map(({ time, duration }) => time + duration));
    }, 4);
  }

  public dispose() {
    this.scores.forEach((score) => score.dispose());
  }

  public serialize() {
    return {
      name: this.name,
      id: this.id,
      scores: this.scores.map((score) => score.serialize()),
    };
  }
}
