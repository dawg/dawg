import fs from '@/wrappers/fs';
import { Loader, RetrievalTypes } from './loader';

export class FileLoader<T> extends Loader<T, { path: string }> {
  get path() {
    return this.opts.path;
  }

  public get(): RetrievalTypes {
    if (!fs.existsSync(this.path)) {
      return {
        type: 'error',
        message: `${this.path} does not exist.`,
      };
    }

    // tslint:disable-next-line:no-console
    console.info(`Loading from ${this.path}`);

    let contents: string;
    try {
      contents = fs.readFileSync(this.path).toString();
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
