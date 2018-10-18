import { shallowMount } from '@vue/test-utils';
import Bpm from '@/components/Bpm.vue';
import Foot from '@/components/Foot.vue';
import middleware from '@/middleware';

middleware();

describe('Bpm.vue', () => {
  it('renders props.msg when passed', () => {
    const wrapper = shallowMount(Bpm, {
      propsData: { value: 128 },
    });
    wrapper.find('.text');
    expect(wrapper.text()).toBe('128 bpm');
  });
});

describe('Foot.vue', () => {
  it('renders with copyright when passed', () => {
    const wrapper = shallowMount(Foot);
    wrapper.find('.position');
    expect(wrapper.text()).toContain('Vuesic');
  });
});
