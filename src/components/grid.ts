import { Ref } from '@vue/composition-api';
import { SchedulableTemp, Sequence } from '@/models';

type Element = SchedulableTemp<any, any>;

export interface PlacementSnapOpts {
  position: number;
  minSnap: number;
  snap: number;
  pxPerBeat: number;
  offset: number;
}

export const snap = (
  opts: PlacementSnapOpts,
) => {
  const rect = opts.reference.getBoundingClientRect();

  // The amount of pixels that the mouse is from the edge of the of grid
  const pxMouseFromLeft =
    (opts.vert ? opts.event.clientY : opts.event.clientX) -
    (opts.vert ? rect.top : rect.left) +
    ((opts.vert ? opts.reference.scrollTop : opts.reference.scrollLeft) ?? 0);

  return calculateSimpleSnap({
    value: pxMouseFromLeft,
    altKey: opts.event.altKey,
    minSnap: opts.minSnap,
    snap: opts.snap,
    pxPerBeat: opts.pxPerBeat,
    round: Math.floor,
  });
};

interface GridOpts {
  sequence: Sequence<any>;
  pxPerBeat: Ref<number>;
  pxPerRow: Ref<number>;
  snap: Ref<number>;
  minSnap: Ref<number>;
  scrollLeft: Ref<number>;
  scrollTop: Ref<number>;
  createElement: Ref<() => Element>;
}

export const createGrid = (
  opts: GridOpts,
) => {
  const selected = new WeakMap<Element, boolean>();

  const addElement = (e: MouseEvent, el: Element) => {
    if (opts.sequence.some((value) => selected.get(value))) {
      opts.sequence.forEach((id) => selected.set(id, false));
      return;
    }

    const time = snap({
      position: e.clientX,
      minSnap: opts.minSnap.value,
      snap: opts.snap.value,
      pxPerBeat: opts.pxPerBeat.value,
      reference: '',
    });

    const row = snap({
      event: e,
      minSnap: 1,
      snap: 1,
      pxPerBeat: this.rowHeight,
      reference: this.$el,
    });

    el.row.value = row;
    el.time.value = time;

    selected[el.element.id] = false;
    opts.sequence.add(el);
  };

  const move = (el: Element, e: MouseEvent) => {
    if (!this.dragStartEvent) {
      return;
    }

    // Get the preVIOUS element first
    // and ALSO grab the current position
    const oldItem = this.elements[i];
    const rect = this.rows.getBoundingClientRect();

    // Get the start BEAT
    let startBeat = (this.dragStartEvent.clientX - rect.left) / this.pxPerBeat;
    startBeat = Math.floor(startBeat / this.snap) * this.snap;

    // Get the end BEAT
    let endBeat = (e.clientX - rect.left) / this.pxPerBeat;
    endBeat = Math.floor(endBeat / this.snap) * this.snap;

    // CHeck if we are going to move squares
    const diff = endBeat - startBeat;
    const time = oldItem.time.value + diff;
    if (time < 0) { return; }

    const y = e.clientY - rect.top;
    const row = Math.floor(y / this.rowHeight);
    if (row < 0) { return; }

    if (row === oldItem.row.value && time === oldItem.time.value) { return; }
    // OK, so we've moved squares
    // Lets update our dragStartEvent or else
    // things will start to go haywyre :////
    this.dragStartEvent = e;

    const timeDiff = time - oldItem.time.value;
    const rowDiff = row - oldItem.row.value;

    let itemsToMove: Array<SchedulableTemp<any, any>>;
    if (this.selected[i]) {
      itemsToMove = this.elements.filter((item, ind) => this.selected[ind]);
    } else {
      itemsToMove = [oldItem];
    }

    if (itemsToMove.some((item) => (item.time.value + timeDiff) < 0)) {
      return;
    }

    itemsToMove.forEach((item) => {
      item.time.value = item.time.value + timeDiff;
      item.row.value = item.row.value + rowDiff;
    });

    this.checkLoopEnd();
  };

  return {
    addElement: (e: MouseEvent) => {
      addElement(e, opts.createElement.value());
    },
    move: (el: Element, e: MouseEvent) => {

    },
  };
};
