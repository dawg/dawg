import Vue, { VueConstructor, CreateElement, VNodeData } from 'vue';

export const createHOC = (component: VueConstructor, createElement: CreateElement, hoc: Vue, data: VNodeData = {}) => {
  // Pass on the...
  // 1. Props
  // 2. Attrs
  // 3. Listeners
  // 4. Slots
  const slots = Object.values(hoc.$slots);

  return createElement(component, {
    ...data,
    // props: {
    //   ...hoc.$props,
    //   ...data.props,
    // },
    attrs: {
      ...hoc.$attrs,
      ...hoc.$props,
      ...data.attrs,
    },
    on: {
      ...hoc.$listeners,
      ...data.on,
    },
  }, slots);
};

export function* chain<T>(...arrays: T[][]) {
  for (const array of arrays) {
    for (const item of array) {
      yield item;
    }
  }
}

export const makeLookup = <T extends { id: string }>(array: Iterable<T>) => {
  const lookup: { [k: string]: T } = {};
  for (const item of array) {
    lookup[item.id] = item;
  }
  return lookup;
};
