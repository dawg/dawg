import fs from '@/fs';
import path from 'path';

import { Module as Mod } from 'vuex';
import { Module, getModule, Action, Mutation } from 'vuex-module-decorators';
import { VuexModule } from '@/store/utils';

import * as io from '@/modules/cerialize';
import store from '@/store/store';
import project from '@/store/project';
import { APPLICATION_PATH, SideTab, PanelNames } from '@/constants';
import { Score, Pattern } from '@/schemas';

const PROJECT_CACHE_PATH = path.join(APPLICATION_PATH, 'project-cache.json');

interface ProjectCache {
  [k: string]: object;
}

/**
 * This information contains information about a project that is specific to a user. For example, which tabs they have
 * open, which pattern they have selected, etc. This information is serialized, but the user does not see this file.
 */
@Module({ dynamic: true, store, name: 'specific' })
export class Specific extends VuexModule {
  @io.autoserialize({ nullable: true }) public backup = false;
  @io.autoserialize({ nullable: true }) public selectedPatternId: string | null = null;
  @io.autoserialize({ nullable: true }) public selectedScoreId: string | null = null;
  @io.autoserialize({ nullable: true }) public openedPanel: PanelNames | null = null;
  @io.autoserialize({ nullable: true }) public openedSideTab: SideTab | null = null;
  @io.autoserialize({ nullable: true }) public openedTab: string | null = null;
  public projectId: string | null = null;

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
    if (!this.scoreLookup.hasOwnProperty(this.selectedScoreId)) { return null; }
    return this.scoreLookup[this.selectedScoreId];
  }

  get scoreLookup() {
    if (!this.selectedPattern) { return null; }
    const scores: {[k: string]: Score} = {};
    this.selectedPattern.scores.forEach((score) => {
      scores[score.id] = score;
    });
    return scores;
  }

  @Action
  public setOpenedPanel(openedPanel: PanelNames) {
    this.set({ key: 'openedPanel', value: openedPanel });
    this.write();
  }

  @Action
  public setOpenedSideTab(sideTab: SideTab) {
    this.set({ key: 'openedSideTab', value: sideTab });
    this.write();
  }

  @Action
  public setTab(tab: string) {
    this.set({ key: 'openedTab', value: tab });
    this.write();
  }

  @Action
  public async loadSpecific() {
    const json = await this.read();
    if (!json.hasOwnProperty(project.id)) {
      // tslint:disable-next-line:no-console
      console.info(`${project.id} does not exist in the project cache`);
      return;
    }

    const projectStuff = json[project.id];
    const decoded = io.deserialize(projectStuff, Specific);
    this.resetSpecific(decoded);
  }

  @Action
  public async read() {
    await fs.writeFileIfNonExistent(PROJECT_CACHE_PATH, '{}');
    const contents = (await fs.readFile(PROJECT_CACHE_PATH)).toString();
    return JSON.parse(contents) as ProjectCache;
  }

  @Action
  public setPattern(pattern: Pattern | null) {
    if (pattern) {
      this.set({ key: 'selectedPatternId', value: pattern.id });
    } else {
      this.set({ key: 'selectedPatternId', value: null });
    }

    this.write();
    if (!this.selectedScoreId || !this.scoreLookup) {
      return;
    }

    if (this.selectedScoreId in this.scoreLookup) {
      return;
    }

    this.set({ key: 'selectedScoreId', value: null });
    this.write();
  }

  @Action
  public setScore(score: Score | null) {
    if (score) {
      this.set({ key: 'selectedScoreId', value: score.id });
    } else {
      this.set({ key: 'selectedScoreId', value: null });
    }
    this.write();
  }

  @Action
  public setBackup(backup: boolean) {
    this.set({ key: 'backup', value: backup });
    this.write();
  }

  @Action
  public async write() {
    if (!project.id) { return; }
    const c = io.serialize(this, Specific);

    const json = await this.read();
    json[project.id] = c;
    await fs.writeFile(PROJECT_CACHE_PATH, JSON.stringify(json, null, 4));
  }

  @Mutation
  private resetSpecific(payload: Specific) {
    Object.assign(this, payload);
  }
}

export default getModule(Specific);
