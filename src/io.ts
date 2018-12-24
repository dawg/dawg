import * as t from 'io-ts';
import { InterfaceType } from 'io-ts';

export default {
  encode <T extends {[k: string]: any}>(i: InterfaceType<T>, o: t.TypeOfProps<T>): T {
    const processed: {[k: string]: any} = {};
    Object.keys(i.props).map((key) => {
      processed[key] = o[key];
    });
    return processed as T;
  },
};
