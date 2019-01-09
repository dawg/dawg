import fs from 'mz/fs';
import io from '@/modules/io';
import path from 'path';

import { Module as Mod } from 'vuex';
import { Mutation, Action, VuexModule, Module, getModule } from 'vuex-module-decorators';
import { autoserialize, autoserializeAs } from 'cerialize';

import store from '@/store/store';
import { APPLICATION_PATH } from '@/constants';

const CACHE_PATH = path.join(APPLICATION_PATH, 'cache.json');

@Module({ dynamic: true, store, name: 'cache' })
export class Cache extends VuexModule {
  @autoserialize public openedFile: string | null = null;
  @autoserialize public openedPanel: string | null = null;
  @autoserialize public openedSideTab: string | null = null;
  @autoserializeAs(String) public folders: string[] = [];

  constructor(module?: Mod<any, any>) {
    super(module || {});
  }

  @Action
  public async fromCacheFolder() {
    if (!(await fs.exists(CACHE_PATH))) {
      await this.write();
    }

    // TODO Error handling
    const contents = (await fs.readFile(CACHE_PATH)).toString();
    const json = JSON.parse(contents);
    const decoded = io.deserialize(json, Cache);
    this.reset(decoded);
  }

  @Mutation
  public reset(o: Cache) {
    Object.assign(this, o);
  }

  @Action
  public setOpenedFile(openedFile: string) {
    this.openedFile = openedFile;
    this.set('openedFile', openedFile);
    // This write call actually works.
    // I was worried it wouldn't work since this method is not async.
    return this.write();
  }

  @Action
  public setOpenedPanel(openedPanel: string) {
    this.set('openedPanel', openedPanel);
    return this.write();
  }

  @Action
  public setOpenedSideTab(sideTab: string) {
    this.set('openedSideTab', sideTab);
    return this.write();
  }

  @Action
  public setFolders(folders: string[]) {
    this.set('folders', folders);
    return this.write();
  }

  @Mutation
  public set<T extends keyof this & string>(key: T, value: this[T]) {
    this[key] = value;
  }

  @Action
  public async write() {
    const c = io.serialize(this, Cache);
    const dir = path.dirname(CACHE_PATH);
    if (!await fs.exists(dir)) {
      await fs.mkdir(dir);
    }

    return fs.writeFile(CACHE_PATH, JSON.stringify(c));
  }
}
export default getModule(Cache);
