import { Deserialize, Serialize } from 'cerialize';

type ConstructorOf<T> = new (...args: any[]) => T;

const deserialize = <T>(o: any, c: ConstructorOf<T>): T => {
  return Deserialize(o, c);
};

const serialize = <T>(o: T, c: ConstructorOf<T>): any => {
  return Serialize(o, c);
};

export default {
  deserialize,
  serialize,
};
