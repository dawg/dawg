import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import Arranger from '@/modules/sequencer/Arranger.vue';
import Vue from 'vue';
import Update from '@/modules/update';
import VueLogger from 'vuejs-logger';
import { Note } from '@/schemas';
import * as io from '@/modules/cerialize';

Vue.use(VueLogger);
Vue.use(Update);

describe(Arranger.name, () => {
  it('should add correctly', () => {
    const wrapper = shallowMount(Arranger, {
      propsData: {
        progress: 0,
        loopStart: 0,
        loopEnd: 0,
        setLoopStart: 0,
        setLoopEnd: 0,
        elements: [],
        sequencerLoopEnd: 0,
        prototype: new Note({ row: 0, duration: 1, time: 0 }),
        rowHeight: 20,
        numRows: 20,
      },
      provide: {
        noteHeight: 16,
        stepsPerBeat: 4,
        beatsPerMeasure: 4,
        pxPerBeat: 80,
      },
    });
    const vm = wrapper.vm as any;
    vm.add({ clientX: 50, clientY: 20 });
    expect(vm.elements.length).to.equal(1);
    let note: Note = wrapper.emitted().added[0][0];
    note = io.serialize(note, Note);
    expect(note).to.deep.equal({
      row: 1,
      duration: 1,
      time: 0.5,
    });

    expect(wrapper.emitted()['update:sequencerLoopEnd'][0][0]).to.equal(4);
  });
});
