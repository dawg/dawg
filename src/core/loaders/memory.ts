import { Loader, RetrievalTypes } from './loader';

export class MemoryLoader<T> extends Loader<T, { data: unknown }> {
  public get(): RetrievalTypes {
    return {
      type: 'retrieval-success',
      item: this.opts.data,
    };
  }
}

