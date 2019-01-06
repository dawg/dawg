import { shallowMount } from '@vue/test-utils';
import Note from '@/components/Note.vue';

let wrapper: ReturnType<typeof shallowMount>;
let vm: any;

// TODO these should be typed!
describe(Note.name, () => {
  beforeEach(() => {
    wrapper = shallowMount(Note, {
      propsData: { id: 2, start: 4, value: 2 },
      provide: {
        snap: 0.25,
        noteHeight: 16,
        pxPerBeat: 80,
      },
    });
    vm = wrapper.vm;
  });
  it('should have the correct width', () => {
    expect(vm.noteConfig.width).toBe(`159px`);
  });
  it('should move correctly', () => {
    vm.move({ clientX: 1 });
    expect(wrapper.emitted().input).toBeFalsy();

    vm.move({ clientX: 50 });
    expect(wrapper.emitted().input).toBeTruthy();
    expect(wrapper.emitted().input[0][0]).toEqual(0.75);
  });
});
