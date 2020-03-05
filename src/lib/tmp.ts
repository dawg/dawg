import fs from '@/lib/fs';
import os from 'os';
import path from 'path';
import { uniqueId } from '@/lib/std';

interface TmpSuccess {
  type: 'success';
  dir: string;
}

interface TmpUnSuccessful {
  type: 'unsuccessful';
}

/**
 * Synchronous version of file.
 */
export function generate(): TmpSuccess | TmpUnSuccessful {
  const dir = path.join(
    os.tmpdir(),
    `tmp-${process.pid}${uniqueId(12)}`,
  );

  try {
    fs.statSync(dir);
  } catch (e) {
    return {
      type: 'success',
      dir,
    };
  }

  return {
    type: 'unsuccessful',
  };
}
