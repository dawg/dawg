import { shallowMount } from '@vue/test-utils';
import Split from './Split.vue';


describe(Split.name, () => {
  it('should have correct gutter style', () => {
    const wrapper = shallowMount(Split, {
      propsData: { gutterSize: 8 },
    });
    wrapper.setData({
      gutter: true,
      parentAxes: 'width',
    });

    // @ts-ignore
    expect(wrapper.vm.gutterStyle.height).toBe(`100%`);
    // @ts-ignore
    expect(wrapper.vm.gutterStyle.width).toBe(`8px`);
  });
});
