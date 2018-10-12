import { shallowMount } from '@vue/test-utils';
import Bpm from '@/components/Bpm.vue';

describe('Bpm.vue', () => {
  it('renders props.msg when passed', () => {
    const wrapper = shallowMount(Bpm, {
      propsData: { value: 128 },
    });
    wrapper.find('.text');
    expect(wrapper.text()).toBe('128 bpm');
  });
});
