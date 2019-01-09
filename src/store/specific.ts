import fs, { read } from 'mz/fs';
import path from 'path';

import { Module as Mod } from 'vuex';
import { Module, getModule, VuexModule, Action, Mutation } from 'vuex-module-decorators';

import io from '@/modules/io';
import store from '@/store/store';
import project from '@/store/project';
import { autoserialize } from 'cerialize';
import { APPLICATION_PATH } from '@/constants';
import { Score, Pattern } from '@/schemas';

const PROJECT_CACHE_PATH = path.join(APPLICATION_PATH, 'project-cache.json');

interface ProjectCache {
  [k: string]: object;
}

@Module({ dynamic: true, store, name: 'general' })
export class Specific extends VuexModule {
  @autoserialize public selectedPatternId: string | null = null;
  @autoserialize public selectedScoreId: string | null = null;
  @autoserialize public selectedSynthId: string | null = null;

  constructor(module?: Mod<any, any>) {
    super(module || {});
  }

  get selectedPattern() {
    if (!this.selectedPatternId) { return null; }
    return project.patternLookup[this.selectedPatternId];
  }

  get selectedScore() {
    if (!this.selectedScoreId) { return null; }
    if (!this.scoreLookup) { return null; }
    return this.scoreLookup[this.selectedScoreId];
  }

  get selectedSynth() {
    if (!this.selectedSynthId) { return null; }
    return project.patternLookup[this.selectedSynthId];
  }

  get scoreLookup() {
    if (!this.selectedPattern) { return null; }
    const scores: {[k: string]: Score} = {};
    this.selectedPattern.scores.forEach((score) => {
      scores[score.id] = score;
    });
    return scores;
  }

  @Mutation
  public setPattern(pattern: Pattern | null) {
    if (pattern) {
      this.selectedPatternId = pattern.id;
    } else {
      this.selectedPatternId = null;
    }
  }

  @Mutation
  public setScore(score: Score | null) {
    if (score) {
      this.selectedScoreId = score.id;
    } else {
      this.selectedScoreId = null;
    }
  }

  @Action
  public async load(projectId: string) {
    if (!(await fs.exists(PROJECT_CACHE_PATH))) {
      await fs.writeFile(PROJECT_CACHE_PATH, JSON.stringify({}));
    }

    const json = await this.read();
    if (!json.hasOwnProperty(projectId)) {
      return;
    }

    const projectStuff = json[projectId];
    const decoded = io.deserialize(projectStuff, Specific);
    this.reset(decoded);
  }

  @Action
  private async read() {
    const contents = (await fs.readFile(PROJECT_CACHE_PATH)).toString();
    return JSON.parse(contents) as ProjectCache;
  }

  // private async write(projectId: string) {
  //   const c = io.serialize(this, Specific);
  //   const dir = path.dirname(PROJECT_CACHE_PATH);
  //   if (!await fs.exists(dir)) {
  //     await fs.mkdir(dir);
  //   }

  //   const json = this.read();

  //   return fs.writeFile(PROJECT_CACHE_PATH, JSON.stringify(c));
  // }

  private reset(payload: Specific) {
    Object.assign(this, payload);
  }
}

export default getModule(Specific);
