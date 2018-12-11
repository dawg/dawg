import { shallowMount } from '@vue/test-utils';
import Sequencer from '@/components/Sequencer.vue';
import Vue from 'vue';
import VueLogger from 'vuejs-logger';

Vue.use(VueLogger);

describe(Sequencer.name, () => {
  it('should compute correctly', () => {
    const wrapper = shallowMount(Sequencer, {
      propsData: { noteHeight: 8, noteWidth: 20, measures: 1 },
    });
    const vm = wrapper.vm as any;
    expect(vm.compute(1, 1)).toEqual({
      x: 20,
      y: 8,
      time: '0:0:1',
      value: 'A#4',
    });
  });
  it('should add correctly', () => {
    const wrapper = shallowMount(Sequencer, {
      propsData: { noteHeight: 8, noteWidth: 20, measures: 1 },
    });
    const vm = wrapper.vm as any;
    vm.add(1, { clientX: 50 });
    expect(vm.notes.length).toBe(1);
    expect(wrapper.emitted().added[0][0]).toEqual({
      col: 2,
      length: 1,
      row: 1,
      selected: false,
      time: '0:0:2',
      value: 'A#4',
      x: 40,
      y: 8,
    });

    expect(wrapper.emitted()['update:measures'][0][0]).toBe(2);
  });
});
