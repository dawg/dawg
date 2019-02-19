import * as vpd from 'vue-property-decorator';
import { WatchOptions } from 'vue';

export function Watch<T>(path: keyof T & string, options?: WatchOptions) {
  return vpd.Watch(path, options);
}

export interface UpdateAugmentation {
  $update: <V extends keyof this & string>(key: V, value: this[V]) => void;
  $put: <T>(elements: T[], i: number, value: T) => void;
}

const U = {
  install(Vue: any) {
    Vue.prototype.$update = function(key: string, value: any) {
      this.$emit(`update:${key}`, value);
    };
    Vue.prototype.$put = function<T>(elements: T[], i: number, value: T) {
      this.$set(elements, i, value);
    };
  },
};

export default U;
