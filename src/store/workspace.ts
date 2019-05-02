import fs from '@/wrappers/fs';
import path from 'path';

import { Module as Mod } from 'vuex';
import { Module, getModule, Action, Mutation } from 'vuex-module-decorators';
import { VuexModule } from '@/store/utils';

import * as io from '@/modules/cerialize';
import store from '@/store/store';
import { APPLICATION_PATH, SideTab, PanelNames, ApplicationContext } from '@/constants';
import { Score, Pattern } from '@/core';
import general from './general';
import { makeLookup } from '@/modules/utils';
import { emitter, EventProvider } from '@/dawg/events';

const PROJECT_CACHE_PATH = path.join(APPLICATION_PATH, 'project-cache.json');

/**
 * This information contains information about a project that is specific to a user. For example, which tabs they have
 * open, which pattern they have selected, etc. This information is serialized, but the user does not see this file.
 */
@Module({ dynamic: true, store, name: 'workspace' })
export class Specific extends VuexModule {

  get transport() {
    if (this.applicationContext === 'pianoroll') {
      const pattern = this.selectedPattern;
      return pattern ? pattern.transport : null;
    } else {
      return general.project.master.transport;
    }
  }

  get patternLookup() {
    return makeLookup(general.project.patterns);
  }

  get selectedPattern() {
    if (!this.selectedPatternId) { return null; }
    if (!(this.selectedPatternId in this.patternLookup)) { return null; }
    return this.patternLookup[this.selectedPatternId];
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

  public events = emitter<{ playPause: () => void }>();
  @io.auto({ optional: true }) public backup = false;
  @io.auto({ nullable: true, optional: true }) public selectedPatternId: string | null = null;
  @io.auto({ nullable: true, optional: true }) public selectedScoreId: string | null = null;
  @io.auto({ nullable: true, optional: true }) public openedPanel: PanelNames | null = null;
  @io.auto({ nullable: true, optional: true }) public openedSideTab: SideTab | null = null;
  @io.auto({ nullable: true, optional: true }) public openedTab: string | null = null;
  @io.auto({ optional: true }) public applicationContext: ApplicationContext = 'pianoroll';
  @io.auto({ optional: true }) public pianoRollRowHeight = 16;
  @io.auto({ optional: true }) public pianoRollBeatWidth = 80;
  @io.auto({ optional: true }) public playlistRowHeight = 40;
  @io.auto({ optional: true }) public playlistBeatWidth = 80;
  @io.auto({ optional: true }) public sideBarSize = 250;
  @io.auto({ optional: true }) public panelsSize = 250;
  @io.auto({ nullable: true }) public pythonPath: string | null = null;
  @io.auto({ nullable: true }) public modelsPath: string | null = null;

  public projectId: string | null = null;

  constructor(module?: Mod<any, any>) {
    super(module || {});
  }

  @Action
  public setOpenedPanel(openedPanel: PanelNames) {
    this.set({ key: 'openedPanel', value: openedPanel });
  }

  @Action
  public setOpenedSideTab(sideTab: SideTab) {
    this.set({ key: 'openedSideTab', value: sideTab });
  }

  @Action
  public setTab(tab: string) {
    this.set({ key: 'openedTab', value: tab });
  }

  @Action
  public async loadSpecific() {
    const json = await this.read();
    if (!json.hasOwnProperty(general.project.id)) {
      // tslint:disable-next-line:no-console
      console.info(`${general.project.id} does not exist in the project cache`);
      return;
    }

    const projectStuff = json[general.project.id];
    const decoded = io.deserialize(projectStuff, Specific);
    this.resetSpecific(decoded);
  }

  @Action
  public async read() {
    await fs.writeFileIfNonExistent(PROJECT_CACHE_PATH, '{}');

    // tslint:disable-next-line:no-console
    console.info('Reading from ' + PROJECT_CACHE_PATH);
    const contents = (await fs.readFile(PROJECT_CACHE_PATH)).toString();

    try {
      return JSON.parse(contents);
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.warn(e.message);
      // TODO We should handle this better
      // Sometimes the file has invalid JSON for some reason
      // We need to figure out why this happens.
      // Since everything is optional, this is ok though
      return {};
    }
  }

  @Action
  public setPattern(pattern: Pattern | null) {
    if (pattern) {
      this.set({ key: 'selectedPatternId', value: pattern.id });
    } else {
      this.set({ key: 'selectedPatternId', value: null });
    }

    if (!this.selectedScoreId || !this.scoreLookup) {
      return;
    }

    if (this.selectedScoreId in this.scoreLookup) {
      return;
    }

    this.set({ key: 'selectedScoreId', value: null });
  }

  @Action
  public setScore(score: Score | null) {
    if (score) {
      this.set({ key: 'selectedScoreId', value: score.id });
    } else {
      this.set({ key: 'selectedScoreId', value: null });
    }
  }

  @Action
  public setBackup(backup: boolean) {
    this.set({ key: 'backup', value: backup });
  }

  @Action
  public async write() {
    if (!general.project.id) { return; }
    const c = io.serialize(this, Specific);

    const json = await this.read();
    json[general.project.id] = c;
    await fs.writeFile(PROJECT_CACHE_PATH, JSON.stringify(json, null, 4));
  }

  @Action
  public setPianoRollRowHeight(value: number) {
    this.set({ key: 'pianoRollRowHeight', value });
  }

  @Action
  public setPianoRollBeatWidth(value: number) {
    this.set({ key: 'pianoRollBeatWidth', value });
  }

  @Action
  public setPlaylistRowHeight(value: number) {
    this.set({ key: 'playlistRowHeight', value });
  }

  @Action
  public setPlaylistBeatWidth(value: number) {
    this.set({ key: 'playlistBeatWidth', value });
  }

  @Action
  public setPanelsSize(value: number) {
    this.set({ key: 'panelsSize', value });
  }

  @Action
  public setSideBarSize(value: number) {
    this.set({ key: 'sideBarSize', value });
  }

  @Mutation
  public setContext(context: ApplicationContext) {
    this.applicationContext = context;
  }

  @Mutation
  public setPythonPath(pythonPath: string) {
    this.pythonPath = pythonPath;
  }

  @Mutation
  public setModelsPath(modelsPath: string) {
    this.modelsPath = modelsPath;
  }

  @Mutation
  public startTransport() {
    if (!this.transport) {
      return;
    }

    this.transport.start();
    general.start();
    this.events.emit('playPause');
  }

  @Mutation
  public stopTransport() {
    if (!this.transport) {
      return;
    }

    this.transport.stop();
    general.pause();
    this.events.emit('playPause');
  }

  @Mutation
  public stopIfStarted() {
    if (this.transport && this.transport.state === 'started') {
      this.stopTransport();
    }
  }

  @Mutation
  public onDidPlayPause(cb: () => void) {
    // TODO(jacob) might cause error
    return new EventProvider(this.events, 'playPause', cb);
  }

  @Mutation
  private resetSpecific(payload: Specific) {
    Object.assign(this, payload);
  }
}

export default getModule(Specific);
