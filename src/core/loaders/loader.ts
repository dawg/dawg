import { PathReporter } from 'io-ts/lib/PathReporter';
import * as t from 'io-ts';

export interface Error {
  type: 'error';
  message: string;
}

export interface RetrievalSuccess {
  type: 'retrieval-success';
  item: unknown;
}

export type RetrievalTypes = Error | RetrievalSuccess;

export interface DecodeSuccess<T> {
  type: 'success';
  decoded: T;
}

export abstract class Loader<T, O> {
  constructor(public type: t.Type<T>, public opts: O) {}

  public async load(): Promise<Error | DecodeSuccess<T>> {
    const retrieval = await this.get();
    if (retrieval.type === 'error') {
      return retrieval;
    }

    const item = retrieval.item;
    const i = this.type.decode(item);
    if (i.isLeft()) {
      const errors = PathReporter.report(i);
      return {
        type: 'error',
        message: errors.join('\n'),
      };
    }

    return {
      type: 'success',
      decoded: i.value,
    };
  }

  protected abstract get(): RetrievalTypes | Promise<RetrievalTypes>;
}
