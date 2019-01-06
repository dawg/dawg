import * as t from 'io-ts';
import fs from 'mz/fs';
import path from 'path';
import { Left } from 'fp-ts/lib/Either';
import { remote } from 'electron';

const { app } = remote;

const APP_DATA = app.getPath('appData');
const DEFAULT = {
  openedFile: null,
  openedPanel: null,
  openedSideTab: null,
  folders: [],
};
const APPLICATION_PATH = path.join(APP_DATA, app.getName());
const CACHE_PATH = path.join(APPLICATION_PATH, 'cache.json');

const CacheType = t.type({
  openedFile: t.union([t.string, t.null]),
  openedPanel: t.union([t.string, t.null]),
  openedSideTab: t.union([t.string, t.null]),
  folders: t.array(t.string),
});
export interface ICache extends t.TypeOf<typeof CacheType> {}

// TODO Create decorator for getters & setters
export default class Cache implements ICache {
  get openedFile() {
    return this.o.openedFile;
  }
  set openedFile(file: string | null) {
    this.o.openedFile = file;
    // This write call actually works.
    // I was worried it wouldn't work since this method is not async.
    this.write();
  }
  get openedPanel() {
    return this.o.openedPanel;
  }
  set openedPanel(openedPanel: string | null) {
    this.o.openedPanel = openedPanel;
    this.write();
  }
  get openedSideTab() {
    return this.o.openedSideTab;
  }
  set openedSideTab(openedSideTab: string | null) {
    this.o.openedSideTab = openedSideTab;
    this.write();
  }
  get folders() {
    return this.o.folders;
  }
  set folders(folders: string[]) {
    this.o.folders = folders;
    this.write();
  }
  public static async writeDefault() {
    const c = new Cache(DEFAULT);
    await c.write();
    return c;
  }
  public static async fromCacheFolder() {
    if (!(await fs.exists(CACHE_PATH))) {
      await Cache.writeDefault();
    }

    // TODO Error handling
    const contents = (await fs.readFile(CACHE_PATH)).toString();
    const decoded = CacheType.decode(JSON.parse(contents));

    if (decoded instanceof Left) {
      // TODO Actual logging
      // tslint:disable-next-line:no-console
      console.warn('cache is invalid');
      return await Cache.writeDefault();
    } else {
      return new Cache(decoded.value);
    }
  }
  constructor(private o: ICache) { }
  public async write() {
    const c = CacheType.encode(this.o);
    const dir = path.dirname(CACHE_PATH);
    if (!await fs.exists(dir)) {
      await fs.mkdir(dir);
    }

    return fs.writeFile(CACHE_PATH, JSON.stringify(c));
  }
}
