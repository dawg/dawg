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
    props: {
      ...hoc.$props,
      ...data.props,
    },
    attrs: {
      ...hoc.$attrs,
      ...data.attrs,
    },
    on: {
      ...hoc.$listeners,
      ...data.on,
    },
  }, slots);
};
