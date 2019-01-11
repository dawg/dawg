import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import Sequencer from '@/components/Sequencer.vue';
import Vue from 'vue';
import Update from '@/modules/update';
import VueLogger from 'vuejs-logger';
import { Note } from '@/schemas';
import io from '@/modules/io';

Vue.use(VueLogger);
Vue.use(Update);

describe(Sequencer.name, () => {
  it('should add correctly', () => {
    const wrapper = shallowMount(Sequencer, {
      propsData: {
        progress: 0,
        loopStart: 0,
        loopEnd: 0,
        setLoopStart: 0,
        setLoopEnd: 0,
        value: [],
        sequencerLoopEnd: 0,
      },
      provide: {
        noteHeight: 16,
        stepsPerBeat: 4,
        beatsPerMeasure: 4,
        pxPerBeat: 80,
      },
    });
    const vm = wrapper.vm as any;
    vm.add(1, { clientX: 50 });
    expect(vm.value.length).to.equal(1);
    let note: Note = wrapper.emitted().added[0][0];
    note = io.serialize(note, Note);
    expect(note).to.deep.equal({
      id: 1,
      duration: 1,
      time: 0.5,
    });

    expect(wrapper.emitted()['update:sequencerLoopEnd'][0][0]).to.equal(4);
  });
});
