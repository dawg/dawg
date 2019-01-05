import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import Split from './Split.vue';
import Vue from 'vue';
import VueLogger from 'vuejs-logger';

Vue.use(VueLogger);

// TODO these should be typed!
describe(Split.name, () => {
  it('should have correct gutter style', () => {
    const wrapper = shallowMount(Split, {
      propsData: { gutterSize: 8 },
    });
    wrapper.setData({
      parent: {
        direction: 'horizontal',
      },
    });

    // @ts-ignore
    expect(wrapper.vm.gutterStyle.height).to.equal(`100%`);
    // @ts-ignore
    expect(wrapper.vm.gutterStyle.width).to.equal(`8px`);
  });
  it('should be root', () => {
    const wrapper = shallowMount(Split);
    // @ts-ignore
    expect(wrapper.vm.isRoot).to.equal(true);
  });
  it('should calculate positions correctly', () => {
    class Dummy {
      public parent = { direction: 'horizontal' };
      public childrenReversed = [];
      constructor(
        public size: number,
        public minSize: number,
        public maxSize: number,
        public fixed: boolean,
        public keep: boolean,
      ) {}
      public setSize(size: number) {
        this.size = size;
      }
    }
    const splits = [
      new Dummy(10, 0, Infinity, false, true),
      new Dummy(10, 8, Infinity, false, false),
      new Dummy(0, 0, 0, true, false),
    ];

    const wrapper = shallowMount(Split);
    // @ts-ignore
    wrapper.vm.calculatePositions(splits, -5, 'horizontal');
    expect(splits[0].size).to.equal(7);
    expect(splits[1].size).to.equal(8);
    expect(splits[2].size).to.equal(0);
  });
});
