import { Deserialize, Serialize } from 'cerialize';

interface ConstructorOf<T> {
  new (...args: any[]): T;
}

const deserialize = <T>(o: any, c: ConstructorOf<T>): T => {
  return Deserialize(o, c);
};

const serialize = (o: any): any => {
  return Serialize(o);
};

export default {
  deserialize,
  serialize,
};
