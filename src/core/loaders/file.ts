import fs from '@/fs';
import * as t from 'io-ts';
import { Loader, RetrievalTypes, Error } from './loader';
import { PathReporter } from 'io-ts/lib/PathReporter';

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

export interface EncodeSuccess {
  type: 'success';
}

export class FileWriter<T> {
  constructor(public type: t.Type<T>, public opts: { data: T, path: string }) {}

  public write(): Error | EncodeSuccess {
    const encoded = this.type.encode(this.opts.data);

    let serialized: string;
    try {
      serialized = JSON.stringify(encoded);
    } catch (e) {
      return {
        type: 'error',
        message: e.message,
      };
    }

    try {
      fs.writeFileSync(this.opts.path, serialized);
    } catch (e) {
      return {
        type: 'error',
        message: e.message,
      };
    }

    return {
      type: 'success',
    };
  }
}
