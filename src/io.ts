import { PathReporter } from 'io-ts/lib/PathReporter';
import * as t from 'io-ts';
export {
  string,
  number,
  literal,
  object,
  Type,
  TypeC,
  boolean,
  undefined,
  array,
  InterfaceType,
  type,
  Mixed,
  partial,
  RecordC,
  record,
  union,
  TypeOf,
  intersection,
  StringC,
  Props,
  NumberC,
  BooleanC,
  ArrayC,
  nullType as null,
  Any,
} from 'io-ts';
import fs from '@/fs';

export interface DecodeSuccess<T> {
  type: 'success';
  decoded: T;
}

export interface Error {
  type: 'error';
  message: string;
}

export const decodeItem = <T>(type: t.Type<T>, item: unknown): Error | DecodeSuccess<T> => {
  const i = type.decode(item);
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
};

export interface EncodeSuccess {
  type: 'success';
}

export const write = <T>(type: t.Type<T>, opts: { data: T, path: string }): Error | EncodeSuccess => {
  const encoded = type.encode(opts.data);

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
    fs.writeFileSync(opts.path, serialized);
  } catch (e) {
    return {
      type: 'error',
      message: e.message,
    };
  }

  return {
    type: 'success',
  };
};

export const read = <T>(type: t.Type<T>, opts: { path: string }): DecodeSuccess<T> | Error => {
  if (!fs.existsSync(opts.path)) {
    return {
      type: 'error',
      message: `${opts.path} does not exist.`,
    };
  }

  // tslint:disable-next-line:no-console
  console.info(`Loading from ${opts.path}`);

  let contents: string;
  try {
    contents = fs.readFileSync(opts.path).toString();
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

  return decodeItem(type, json);
};
