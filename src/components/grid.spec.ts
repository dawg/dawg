import Vue from 'vue';
import VueCompositionApi, { ref, Ref } from '@vue/composition-api';
Vue.use(VueCompositionApi);
import { createGrid, GridOpts } from '@/components/grid';
import { SchedulableTemp, createNotePrototype, Instrument, Sequence, Synth } from '@/models';
import { expect } from '@/lib/testing';
import * as Audio from '@/lib/audio';

type Element = SchedulableTemp<Instrument<any, any>, 'note'>;

const transport = new Audio.Transport();
const create = <T extends SchedulableTemp<any, any>>(opts: Partial<GridOpts<T>> = {}) => {
  const createElement = () => {
    return createNotePrototype(
      { time: 0, duration: 1, row: 0 },
      new Synth(Audio.ToneMaster, { instrument: 'synth', type: 'fatsawtooth', name: '' }),
    )(transport);
  };

  const sequence = ref(new Sequence([createElement()])) as Ref<Sequence<Element>>;
  const o = {
    sequence,
    pxPerBeat: opts.pxPerBeat ?? ref(20),
    pxPerRow: opts.pxPerRow ?? ref(10),
    snap: opts.snap ?? ref(0),
    minSnap: opts.minSnap ?? ref(0),
    scrollLeft: opts.scrollLeft ?? ref(0),
    scrollTop: opts.scrollTop ?? ref(0),
    beatsPerMeasure: opts.beatsPerMeasure ?? ref(4),
    createElement: ref(createElement),
    tool: opts.tool ?? ref(0),
    getBoundingClientRect: opts.getBoundingClientRect ?? (() => ({ left: 0, top: 0 })),
  };

  return {
    grid: createGrid(o),
    sequence,
  };
};

// const create = () => ({});

describe.only('grid', () => {
  it('creates correctly', () => {
    const { grid } = create();
    expect(grid.itemLoopEnd.value).to.eq(4);
  });

  it('adds elements correctly', () => {
    // const transport = new Audio.Transport();

    // const { grid, sequence } = create();
    // grid.mousedown(new MouseEvent('mousedown', { clientX: 20, clientY: 10 }));
    // window.dispatchEvent(new MouseEvent('mouseup', { clientX: 20, clientY: 10 }));
    // expect(sequence.value.elements.length).to.eq(2);
    // expect(sequence.value.elements[1].row.value).to.eq(1);
    // expect(sequence.value.elements[1].time.value).to.eq(1);
  });
});
