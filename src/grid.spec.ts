import Vue from 'vue';
import VueCompositionApi, { ref } from '@vue/composition-api';
Vue.use(VueCompositionApi);

import { createGrid, GridOpts } from '@/grid';
import { ScheduledElement, createNotePrototype, Instrument, Synth } from '@/models';
import { expect } from '@/lib/testing';
import * as Audio from '@/lib/audio';

type Element = ScheduledElement<Instrument, 'note', any>;

type Grid = ReturnType<typeof createGrid>;

const transport = Audio.createTransport();
const create = <T extends ScheduledElement<any, any, any>>(
  cb: (o: { grid: Grid, sequence: Element[] }) => void, opts: Partial<GridOpts<T>> = {},
) => {
  const createElement = () => {
    return createNotePrototype(
      { time: 2, duration: 1, row: 2 },
      new Synth({ instrument: 'synth', type: 'sine', name: '' }),
      { velocity: 1 },
    )(transport);
  };

  const sequence = [createElement().copy()];

  const o = {
    sequence,
    pxPerBeat: opts.pxPerBeat ?? ref(20),
    pxPerRow: opts.pxPerRow ?? ref(10),
    snap: opts.snap ?? ref(0.25),
    minSnap: opts.minSnap ?? ref(0.125),
    scrollLeft: opts.scrollLeft ?? ref(0),
    scrollTop: opts.scrollTop ?? ref(0),
    beatsPerMeasure: opts.beatsPerMeasure ?? ref(4),
    createElement: createElement().copy,
    tool: opts.tool ?? ref(0),
    getPosition: opts.getPosition ?? (() => ({ left: 0, top: 0 })),
  };

  const grid = createGrid(o);

  const result = cb({
    grid,
    sequence,
  });

  grid.dispose();

  return result;
};

type Events = 'md' | 'mm' | 'mu';
interface Mouvement { x?: number; y?: number; }

const events = (grid: Grid) => {
  let x = 0;
  let y = 0;

  const lookup = {
    md: 'mousedown',
    mm: 'mousemove',
    mu: 'mouseup',
  };

  const build = (name: Events, mouvement: Mouvement = {}) => {
    x += (mouvement.x ?? 0) * 20;
    y += (mouvement.y ?? 0) * 10;

    return new MouseEvent(lookup[name], { clientX: x, clientY: y });
  };

  const emit = (name: Events, mouvement: Mouvement = {}) => {
    const e = build(name, mouvement);

    if (name === 'md') {
      grid.mousedown(e);
    } else {
      window.dispatchEvent(e);
    }

    return {
      build,
      emit,
    };
  };

  return {
    build,
    emit,
  };
};

describe('grid', () => {
  it('creates correctly', () => {
    create(({ grid, sequence }) => {
      expect(sequence.length).to.eq(1);
      expect(grid.sequencerLoopEnd.value).to.eq(4);
    });
  });

  it('adds elements correctly', () => {
    create(({ grid, sequence }) => {
      events(grid).emit('md', { x: 1, y: 1 }).emit('mu');
      expect(sequence.length).to.eq(2);
      expect(grid.selected.length).to.eq(0);
      expect(sequence[1].row.value).to.eq(1);
      expect(sequence[1].time.value).to.eq(1);
    });
  });

  it('doesn\'t add elements if the user moves their mouse', () => {
    create(({ grid, sequence }) => {
      events(grid).emit('md', { x: 1, y: 1 }).emit('mm', { x: 0.1 }).emit('mu');
      expect(sequence.length).to.eq(1);
    });
  });

  it('correctly selects elements', () => {
    create(({ grid, sequence }) => {
      const emitter = events(grid).emit('md', { x: 0.5, y: 1 })
        .emit('mm', { x: 2.5, y: 2 });
      expect(grid.selectStyle.value?.left).to.eq('10px');
      expect(grid.selectStyle.value?.top).to.eq('10px');
      expect(grid.selectStyle.value?.width).to.eq('50px');
      expect(grid.selectStyle.value?.height).to.eq('20px');
      expect(grid.selected.includes(sequence[0])).to.eq(true);
      emitter.emit('mu');
    }, { tool: ref('pointer') });
  });

  it('correctly slices element', () => {
    create(({ grid, sequence }) => {
      const emitter = events(grid).emit('md', { x: 2.5, y: 0 })
        .emit('mm', { y: 3 });
      expect(grid.sliceStyle.value?.left).to.eq(`${2.5 * 20 - 3 * 10 / 2}px`);
      expect(grid.sliceStyle.value?.top).to.eq(`${3 * 10 / 2}px`);
      expect(grid.sliceStyle.value?.width).to.eq(`${3 * 10}px`);
      emitter.emit('mu');
      expect(sequence.length).to.eq(2);
      expect(sequence[0].time.value).to.eq(2);
      expect(sequence[0].duration.value).to.eq(0.5);
      expect(sequence[1].time.value).to.eq(2.5);
      expect(sequence[1].duration.value).to.eq(0.5);
    }, { tool: ref('slicer') });
  });

  it('can move elements', () => {
    create(({ grid, sequence }) => {
      const el = sequence[0];
      expect(el.time.value).to.eq(2);
      const emitter = events(grid);
      grid.select(emitter.build('md', { x: 2.5, y: 2.5 }), 0);
      emitter.emit('mm', { x: 1 });
      expect(el.time.value).to.eq(3);
    }, { getPosition: () => ({ left: 10, top: 0 }), scrollLeft: ref(20), scrollTop: ref(0) });
  });

  it('correctly sets loop end', async () => {
    await create(async ({ grid, sequence }) => {
      events(grid).emit('md', { x: 5, y: 0.5 }).emit('mu');
      await Vue.nextTick();
      expect(sequence.length).to.eq(2);
      expect(grid.sequencerLoopEnd.value).to.eq(8);
    });
  });

  it('can remove elements', () => {
    create(({ grid, sequence }) => {
      grid.remove(0, new MouseEvent(''));
      expect(sequence.length).to.eq(0);
    });
  });
});
