import fs from 'mz/fs';
import { Loader, RetrievalTypes } from './loader';

export class FileLoader<T> extends Loader<T, { path: string }> {
  get path() {
    return this.opts.path;
  }

  public async get(): Promise<RetrievalTypes> {
    if (!await fs.exists(this.path)) {
      return {
        type: 'error',
        message: `${this.path} does not exist.`,
      };
    }

    // tslint:disable-next-line:no-console
    console.info(`Loading from ${this.path}`);

    let contents: string;
    try {
      contents = (await fs.readFile(this.path)).toString();
    } catch (e) {
      return {
        type: 'error',
        message: e.message,
      };
    }

    let json: any;
    try {
      json = JSON.parse(contents);
    } catch (e) {
      return {
        type: 'error',
        message: e.message,
      };
    }

    return {
      type: 'retrieval-success',
      item: json,
    };
  }
}
