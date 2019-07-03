import path from 'path';
import fs from 'mz/fs';
export { FSWatcher } from 'mz/fs';

// TODO Remove this eventually
// Or change the name
// And make everything that accesses fs use this file

const mkdirRecursive = async (dir: string) => {
  if (!(await fs.exists(dir))) {
    await mkdirRecursive(path.join(dir, '..'));
    await fs.mkdir(dir);
  }
};

const mkdirRecursiveSync = (dir: string) => {
  if (!fs.exists(dir)) {
    mkdirRecursiveSync(path.join(dir, '..'));
    fs.mkdirSync(dir);
  }
};

const writeFile = async (filename: string, data: string | Buffer | DataView) => {
  const toWrite = data as any;
  const dir = path.dirname(filename);
  await mkdirRecursive(dir);
  await fs.writeFile(filename, toWrite);
};

const writeFileSync = (filename: string, data: string | Buffer | DataView) => {
  const toWrite = data as any;
  const dir = path.dirname(filename);
  mkdirRecursiveSync(dir);
  fs.writeFileSync(filename, toWrite);
};

const writeFileIfNonExistent = async (filename: string, data: string) => {
  if (!(await fs.exists(filename))) {
    await writeFile(filename, data);
  }
};


export default {
  mkdirRecursive,
  mkdirRecursiveSync,
  writeFile,
  writeFileSync,
  exists: fs.exists,
  writeFileIfNonExistent,
  readFile: fs.readFile,
  stat: fs.stat,
  readdir: fs.readdir,
  watch: fs.watch,
  unlink: fs.unlink,
  existsSync: fs.existsSync,
  readFileSync: fs.readFileSync,
};
