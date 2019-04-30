import path from 'path';
import fs from 'mz/fs';
export { FSWatcher } from 'mz/fs';

// TODO Remove this eventually
// Or change the name
// And make everything that accesses fs use this file

const mkdirRecursive = (dir: string) => {
  if (!fs.existsSync(dir)) {
    mkdirRecursive(path.join(dir, '..'));
    fs.mkdirSync(dir);
  }
};

const writeFile = async (filename: string, data: string | Buffer | DataView) => {
  const toWrite = data as any;
  const dir = path.dirname(filename);
  mkdirRecursive(dir);
  await fs.writeFile(filename, toWrite);
};

const writeFileIfNonExistent = async (filename: string, data: string) => {
  if (!(await fs.exists(filename))) {
    await writeFile(filename, data);
  }
};


export default {
  mkdirRecursive,
  writeFile,
  exists: fs.exists,
  writeFileIfNonExistent,
  readFile: fs.readFile,
  stat: fs.stat,
  readdir: fs.readdir,
  watch: fs.watch,
  unlink: fs.unlink,
};
