// TODO Use This
export interface UpdateAugmentation {
  $update: <V extends keyof this>(key: V, value: this[V]) => void;
}

const Update = {
  install(Vue: any) {
    Vue.prototype.$update = function(key: string, value: any) {
      this.$emit(`update:${key}`, value);
    };
  },
};

export default Update;
