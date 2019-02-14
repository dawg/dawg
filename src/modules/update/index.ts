import { Watch as W } from 'vue-property-decorator';
import Vue, { WatchOptions } from 'vue';

interface Events {
  [name: string]: any[];
}

export class Bus<E extends Events> extends Vue {
  public $on<T extends keyof E & string>(name: T, callback: (...payload: E[T]) => void) {
    return super.$on(name, callback);
  }
  public $emit<T extends keyof E & string>(name: T, ...payload: E[T]) {
    return super.$emit(name, payload);
  }
}

export function Watch<T>(path: keyof T & string, options?: WatchOptions) {
  return W(path, options);
}

export interface UpdateAugmentation {
  $update: <V extends keyof this & string>(key: V, value: this[V]) => void;
}

export default {
  install(Vue: any) {
    Vue.prototype.$update = function(key: string, value: any) {
      this.$emit(`update:${key}`, value);
    };
  },
};
