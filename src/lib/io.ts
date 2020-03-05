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
  PartialC,
  LiteralC,
  BooleanC,
  ArrayC,
  IntersectionC,
  nullType as null,
  Any,
} from 'io-ts';
import fs from '@/lib/fs';
import { isLeft } from 'fp-ts/lib/Either';
import { getLogger } from '@/lib/log';
import { Reporter } from 'io-ts/lib/Reporter';
import { fold } from 'fp-ts/lib/Either';

function stringify(v: any): string {
  if (typeof v === 'function') {
    return t.getFunctionName(v);
  }
  if (typeof v === 'number' && !isFinite(v)) {
    if (isNaN(v)) {
      return 'NaN';
    }
    return v > 0 ? 'Infinity' : '-Infinity';
  }
  return JSON.stringify(v);
}

function getContextPath(context: t.Context): string {
  return context.map(({ key }) => `${key}`).join('.');
}

export const PathReporter: Reporter<string[] | null> = {
  report: fold(
    (es) => es.map((e) => {
      return e.message ?? `Invalid value "${stringify(e.value)}" supplied to ${getContextPath(e.context)}`;
    }),
    () => null,
  ),
};


const logger = getLogger('io');

export interface DecodeSuccess<T> {
  type: 'success';
  decoded: T;
}

export interface NotFound {
  type: 'not-found';
}

export interface Error {
  type: 'error';
  message: string;
}

export const decodeItem = <T>(type: t.Type<T>, item: unknown): Error | DecodeSuccess<T> => {
  const i = type.decode(item);
  if (isLeft(i)) {
    // const errors = i.left;
    // i.left.map((error) => error.context.map(({ key }) => key).join('.'));

    const errors = PathReporter.report(i);
    return {
      type: 'error',
      message: errors ? errors.join('\n') : '',
    };
  }

  return {
    type: 'success',
    decoded: i.right,
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

export const read = <T>(type: t.Type<T>, opts: { path: string }): DecodeSuccess<T> | NotFound | Error => {
  if (!fs.existsSync(opts.path)) {
    return {
      type: 'not-found',
    };
  }

  logger.info(`Loading from ${opts.path}`);

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
