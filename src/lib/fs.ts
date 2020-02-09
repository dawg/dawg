import path from 'path';
import fs from 'fs';
export { FSWatcher } from 'fs';

const exists = (p: string) => {
  return new Promise((resolve) => {
    fs.exists(p, (result) => {
      resolve(result);
    });
  });
};

const mkdir = (p: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.mkdir(p, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
};

const readFile = (p: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    fs.readFile(p, (err, buffer) => {
      if (err) {
        reject(err);
      }
      resolve(buffer);
    });
  });
};

const stat = (p: string) => {
  return new Promise((resolve, reject) => {
    fs.stat(p, (err, result) => {
      if (err) {
        reject(err);
      }

      resolve(result);
    });
  });
};

const readdir = (p: string) => {
  return new Promise((resolve, reject) => {
    fs.readdir(p, (err, result) => {
      if (err) {
        reject(err);
      }

      resolve(result);
    });
  });
};

export const readdirSync = fs.readdirSync;

export const statSync = fs.statSync;

export const watch = fs.watch;

const unlink = (p: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(p, (err) => {
      if (err) {
        reject(err);
      }

      resolve();
    });
  });
};

export const existsSync = fs.existsSync;

export const readFileSync = fs.readFileSync;


const mkdirRecursive = async (dir: string) => {
  if (!(await exists(dir))) {
    await mkdirRecursive(path.join(dir, '..'));
    await mkdir(dir);
  }
};

const mkdirRecursiveSync = (dir: string) => {
  if (!exists(dir)) {
    mkdirRecursiveSync(path.join(dir, '..'));
    fs.mkdirSync(dir);
  }
};

const writeFile = async (filename: string, data: string | Buffer | DataView): Promise<void> => {
  const toWrite = data as any;
  const dir = path.dirname(filename);
  await mkdirRecursive(dir);
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, toWrite, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
};

const writeFileSync = (filename: string, data: string | Buffer | DataView) => {
  const toWrite = data as any;
  const dir = path.dirname(filename);
  mkdirRecursiveSync(dir);
  fs.writeFileSync(filename, toWrite);
};

const writeFileIfNonExistent = async (filename: string, data: string) => {
  if (!(await exists(filename))) {
    await writeFile(filename, data);
  }
};


export default {
  mkdirRecursive,
  mkdirRecursiveSync,
  writeFile,
  writeFileSync,
  exists,
  writeFileIfNonExistent,
  readFile,
  stat,
  readdir,
  readdirSync,
  statSync,
  watch,
  unlink,
  existsSync,
  readFileSync,
};
