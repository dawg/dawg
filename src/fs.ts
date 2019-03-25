import path from 'path';
import fs from 'mz/fs';

// TODO Remove this eventually
// Or change the name
// And make everything that accesses fs use this file

const mkdirRecursive = (dir: string) => {
  if (!fs.existsSync(dir)) {
    mkdirRecursive(path.join(dir, '..'));
    fs.mkdirSync(dir);
  }
};

const writeFile = async (filename: string, data: string) => {
  const dir = path.dirname(filename);
  mkdirRecursive(dir);
  await fs.writeFile(filename, data);
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
};
