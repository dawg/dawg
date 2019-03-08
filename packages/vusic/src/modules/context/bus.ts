import Vue from 'vue';

export interface Item {
  text: string;
  callback: (e: MouseEvent) => void;
}

interface EventInterface {
  show: {
    e: MouseEvent | Position, items: Array<Item | null>,
  };
}

export interface Position {
  left: number;
  bottom: number;
}

export const isMouseEvent = (e: object): e is MouseEvent => {
  return e.hasOwnProperty('target');
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
