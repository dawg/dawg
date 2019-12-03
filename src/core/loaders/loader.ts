import * as t from '@/modules/io';
import { Error, DecodeSuccess, decodeItem } from '@/modules/io';

export {
  Error,
};

export interface RetrievalSuccess {
  type: 'retrieval-success';
  item: unknown;
}

export type RetrievalTypes = Error | RetrievalSuccess;


export abstract class Loader<T, O> {
  constructor(public type: t.Type<T>, public opts: O) {}

  public load(): Error | DecodeSuccess<T> {
    const result = this.get();
    if (result.type === 'error') {
      return result;
    }

    return decodeItem(this.type, result.item);
  }

  protected abstract get(): RetrievalTypes;
}
