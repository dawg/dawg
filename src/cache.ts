import * as t from 'io-ts';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { Left } from 'fp-ts/lib/Either';
import { remote, ipcRenderer } from 'electron';

const { dialog } = remote;

const CacheType = t.type({
  currentOpenedFile: t.union([t.string, t.null]),
});
const ReadOnlyCache = t.readonly(CacheType);
export interface Cache extends t.TypeOf<typeof ReadOnlyCache> {}

const writeCache = (c: Cache) => {
  c = CacheType.encode(c);
  fs.writeFileSync(CACHE_PATH, JSON.stringify(c));
};

const writeAndUpdateCache = (c: Cache) => {
  CACHE = c;
  writeCache(c);
};

const APP_DATA = app.getPath('appData');
const DEFAULT = { currentOpenedFile: null };
const APPLICATION_PATH = path.join(APP_DATA, app.getName(), 'cache.json');
const CACHE_PATH = path.join(APPLICATION_PATH, 'cache.json');
let CACHE: Cache;

if (!fs.existsSync(CACHE_PATH)) {
  writeCache(DEFAULT);
}

const contents = fs.readFileSync(CACHE_PATH).toString();
const decoded = CacheType.decode(contents);

if (decoded instanceof Left) {
  // TODO Actual logging
  // tslint:disable-next-line:no-console
  console.warn('cache is invalid');
  CACHE = DEFAULT;
  writeCache(DEFAULT);
} else {
  CACHE = decoded.value;
}

export const setOpenedFile = (file: string) => {
  writeAndUpdateCache({
    ...CACHE,
    currentOpenedFile: file,
  });
};

export default CACHE;
