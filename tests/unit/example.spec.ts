import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import Bpm from '@/components/Bpm.vue';
// import Foot from '@/components/Foot.vue';


describe('Bpm.vue', () => {
  it('renders props.msg when passed', () => {
    const wrapper = shallowMount(Bpm, {
      propsData: { value: 128 },
    });
    wrapper.find('.text');
    expect(wrapper.text()).to.equal('128bpm');
  });
});

// describe('Foot.vue', () => {
//   it('renders with copyright when passed', () => {
//     const wrapper = shallowMount(Foot, {
//       propsData: { openedFile: '/some/folder/DAWG.ts' },
//     });
//     wrapper.find('.position');
//     expect(wrapper.text()).to.contain('DAWG');
//   });
// });
