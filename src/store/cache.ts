import fs from 'mz/fs';
import io from '@/modules/io';
import path from 'path';

import { Module as Mod } from 'vuex';
import { Mutation, Action, Module, getModule } from 'vuex-module-decorators';
import { autoserialize, autoserializeAs } from 'cerialize';

import store from '@/store/store';
import { APPLICATION_PATH } from '@/constants';
import { VuexModule } from '@/store/utils';

const CACHE_PATH = path.join(APPLICATION_PATH, 'cache.json');

@Module({ dynamic: true, store, name: 'cache' })
export class Cache extends VuexModule {
  @autoserialize public openedFile: string | null = null;
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
    this.set({ key: 'openedFile', value: openedFile });
    // This write call actually works.
    // I was worried it wouldn't work since this method is not async.
    return this.write();
  }

  @Action
  public setFolders(folders: string[]) {
    this.set({ key: 'folders', value: folders });
    return this.write();
  }

  @Action
  public async write() {
    const c = io.serialize(this, Cache);
    const dir = path.dirname(CACHE_PATH);
    if (!await fs.exists(dir)) {
      await fs.mkdir(dir);
    }

    return fs.writeFile(CACHE_PATH, JSON.stringify(c, null, 4));
  }
}
export default getModule(Cache);
