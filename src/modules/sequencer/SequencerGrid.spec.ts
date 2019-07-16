import { shallowMount, Wrapper } from '@vue/test-utils';
import Arranger from '@/modules/sequencer/Arranger.vue';
import Vue from 'vue';
import Update from '@/modules/update';

Vue.use(Update);
let wrapper: Wrapper<Arranger>;
let vm: any;


describe(Arranger.name, () => {
  beforeEach(() => {
    wrapper = shallowMount(Arranger, {
      propsData: {
        progress: 0,
        loopStart: 0,
        loopEnd: 0,
        setLoopStart: 0,
        setLoopEnd: 0,
        elements: [],
        sequencerLoopEnd: 0,
        // prototype: new Note({ row: 0, duration: 1, time: 0 }),
        rowHeight: 20,
        numRows: 20,
        name: 'SDF',
      },
      provide: {
        noteHeight: 16,
        stepsPerBeat: 4,
        beatsPerMeasure: 4,
        pxPerBeat: 80,
      },
    });

    vm = wrapper.vm as any;
  });

  it('should add correctly', () => {
    // vm.add({ clientX: 50, clientY: 20 });
    // expect(vm.elements.length).to.equal(1);
    // let note: Note = wrapper.emitted().added[0][0];
    // note = io.serialize(note, Note);
    // expect(note).to.deep.equal({
    //   row: 1,
    //   duration: 1,
    //   time: 0.5,
    // });

    // expect(wrapper.emitted()['update:sequencerLoopEnd'][1][0]).to.equal(4);
  });

  it('should move correctly', () => {
    // vm.move({ clientX: 1 });
    // expect(wrapper.emitted().input).to.equal(undefined);

    // vm.move({ clientX: 50 });
    // expect(wrapper.emitted().input[0][0]).to.equal(0.75);
  });
});
