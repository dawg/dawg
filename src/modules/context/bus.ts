import Vue from 'vue';
import { Key } from '../palette';

export interface Item {
  text: string;
  shortcut?: Key[];
  callback: (e: MouseEvent) => void;
}

interface EventInterface {
  show: {
    e: MouseEvent | Position,
    items: Array<Item | null>,
  };
}

export interface Position {
  left: number;
  bottom: number;
}

export const isMouseEvent = (e: object): e is MouseEvent => {
  return e instanceof Event;
};

class Bus extends Vue {
  public $on<T extends keyof EventInterface>(name: T, callback: (payload: EventInterface[T]) => void) {
    return super.$on(name, callback);
  }
  public $emit<T extends keyof EventInterface>(name: T, payload: EventInterface[T]) {
    return super.$emit(name, payload);
  }
}

export default new Bus();
