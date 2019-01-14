import Vue from 'vue';

export interface Item {
  text: string;
  callback: () => void;
}

interface EventInterface {
  show: {
    e: MouseEvent, items: Item[],
  };
}

class Bus extends Vue {
  public $on<T extends keyof EventInterface>(name: T, callback: (payload: EventInterface[T]) => void) {
    return super.$on(name, callback);
  }
  public $emit<T extends keyof EventInterface>(name: T, payload: EventInterface[T]) {
    return super.$emit(name, payload);
  }
}

export default new Bus();
