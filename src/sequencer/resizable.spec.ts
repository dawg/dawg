import { expect } from 'chai';
import Vue from 'vue';
// import { resizable } from '@/sequencer';
import { shallowMount } from '@vue/test-utils';

const Tester = Vue.component('Tester', {
  template: `<div></div>`,
});

// const Resizable = resizable(Tester);

describe('Resizable', () => {
  it('should have the correct width', () => {
    // @ts-ignore
    // const wrapper = shallowMount(Resizable, {
    //   propsData: {
    //     height: 10,
    //     duration: 2,
    //   },
    //   provide: {
    //     snap: 0.25,
    //     pxPerBeat: 80,
    //   },
    // });

    // const vm = wrapper.vm as any;
    // expect(vm.width).to.equal(160);
  });
});
