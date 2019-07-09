import fs from '@/wrappers/fs';
import path from 'path';

import { Module as Mod } from 'vuex';
import { Module, getModule, Action, Mutation } from 'vuex-module-decorators';
import { VuexModule } from '@/store/utils';

import * as io from '@/modules/cerialize';
import store from '@/store/store';
import { APPLICATION_PATH } from '@/constants';
import general from './general';
import { makeLookup } from '@/modules/utils';
import * as dawg from '@/dawg';

const PROJECT_CACHE_PATH = path.join(APPLICATION_PATH, 'project-cache.json');

/**
 * This information contains information about a project that is specific to a user. For example, which tabs they have
 * open, which pattern they have selected, etc. This information is serialized, but the user does not see this file.
 */
@Module({ dynamic: true, store, name: 'workspace' })
export class Specific extends VuexModule {

  get selectedPattern() {
    return dawg.patterns.selectedPattern.value;
  }

  get patternLookup() {
    return makeLookup(general.project.patterns);
  }

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
  public setPythonPath(pythonPath: string) {
    this.pythonPath = pythonPath;
  }

  @Mutation
  public setModelsPath(modelsPath: string) {
    this.modelsPath = modelsPath;
  }

  @Mutation
  private resetSpecific(payload: Specific) {
    Object.assign(this, payload);
  }
}

export default getModule(Specific);
