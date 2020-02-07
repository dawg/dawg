import { Watch as W } from 'vue-property-decorator';
import { WatchOptions } from 'vue';

export function Watch<T>(path: keyof T & string, options?: WatchOptions) {
  return W(path, options);
}

export interface UpdateAugmentation {
  $update: <V extends keyof this & string>(key: V, value: this[V]) => void;
}

export default {
  install(vue: any) {
    vue.prototype.$update = function(key: string, value: any) {
      this.$emit(`update:${key}`, value);
    };
  },
};
