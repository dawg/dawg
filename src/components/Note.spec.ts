import { shallowMount } from '@vue/test-utils';
import Note from '@/components/Note.vue';

// TODO these should be typed!
describe(Note.name, () => {
  it('should have the correct width', () => {
    const wrapper = shallowMount(Note, {
      propsData: { height: 8, width: 8, value: 2 },
    });
    const vm = wrapper.vm as any;
    expect(vm.noteConfig.width).toBe(`15px`);
  });
  it('should move correctly', () => {
    const wrapper = shallowMount(Note, {
      propsData: { height: 8, width: 8, value: 2 },
    });
    const vm = wrapper.vm as any;

    vm.move({ clientX: 17 });
    expect(wrapper.emitted().input).toBeFalsy();

    vm.move({ clientX: 50 });
    expect(wrapper.emitted().input).toBeTruthy();
    expect(wrapper.emitted().input[0]).toEqual([Math.round(50 / 8)]);
  });
});
