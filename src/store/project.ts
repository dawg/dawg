import { autoserialize, autoserializeAs } from 'cerialize';
import { VuexModule, Mutation } from 'vuex-module-decorators';
import { Module } from 'vuex';
import { Pattern, Instrument, Score } from '@/schemas';

export default class Project extends VuexModule {
  @autoserialize public bpm = 128;
  @autoserializeAs(Pattern) public patterns: Pattern[] = [];
  @autoserializeAs(Instrument) public instruments: Instrument[] = [];
  public selectedPattern: Pattern | null = null;
  public selectedScore: Score | null = null;
  public selectedSynth: Instrument | null = null;

  constructor(module?: Module<any, any>) {
    super(module || {});
  }

  @Mutation
  public reset(payload: Project) {
    Object.assign(this, payload);
  }

  @Mutation
  public addInstrument() {
    let name: string;
    let count = 0;
    while (true) {
      name = `Instrument ${count}`;
      let found = false;
      for (const instrument of this.instruments) {
        if (instrument.name === name) {
          found = true;
          break;
        }
      }

      if (!found) {
        break;
      }

      count++;
    }
    this.instruments.push(Instrument.default(name));
  }

  get patternLookup() {
    const patterns: {[k: string]: Pattern} = {};
    this.patterns.forEach((pattern) => {
      patterns[pattern.name] = pattern;
    });
    return patterns;
  }
}
