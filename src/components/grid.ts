import { Ref, watch, ref, computed } from '@vue/composition-api';
import { SchedulableTemp, Sequence } from '@/models';
import { addEventListeners, addEventListener } from '@/lib/events';
import { Keys, Disposer, reverse } from '@/lib/std';
import { calculateSimpleSnap, slice } from '@/utils';

// For more information see the following link:
// https://stackoverflow.com/questions/4270485/drawing-lines-on-html-page
function lineStyle(
  { x1, y1, x2, y2 }: { x1: number, y1: number, x2: number, y2: number },
) {
  const a = x1 - x2;
  const b = y1 - y2;
  const c = Math.sqrt(a * a + b * b);

  const sx = (x1 + x2) / 2;
  const sy = (y1 + y2) / 2;

  const x = sx - c / 2;
  const y = sy;

  const alpha = Math.PI - Math.atan2(-b, a);
  return {
    border: '1px solid white',
    width: c + 'px',
    height: 0,
    transform: 'rotate(' + alpha + 'rad)',
    position: 'absolute',
    top: y + 'px',
    left: x + 'px',
  };
}

type Line = ReturnType<typeof lineStyle>;

type Element = SchedulableTemp<any, any>;

export interface PlacementSnapOpts {
  position: number;
  minSnap: number;
  snap: number;
  pxPerBeat: number;
  offset: number;
  scroll: number;
  altKey: boolean;
}

export const doSnap = (
  opts: PlacementSnapOpts,
) => {
  // The amount of pixels that the mouse is from the edge of the of grid
  const pxMouseFromLeft = opts.position - opts.offset + opts.scroll;

  return calculateSimpleSnap({
    value: pxMouseFromLeft / opts.pxPerBeat,
    altKey: opts.altKey,
    minSnap: opts.minSnap,
    snap: opts.snap,
    round: Math.floor,
  });
};

export interface GridOpts<T extends Element> {
  sequence: Readonly<Ref<Readonly<Sequence<T>>>>;
  pxPerBeat: Ref<number>;
  pxPerRow: Ref<number>;
  snap: Ref<number>;
  minSnap: Ref<number>;
  scrollLeft: Ref<number>;
  scrollTop: Ref<number>;
  beatsPerMeasure: Ref<number>;
  createElement: Ref<Readonly<undefined | (() => T)>>;
  getPosition: () => { left: number, top: number };
  tool: Ref<'pointer' | 'slicer'>;
}

export const createGrid = <T extends Element>(
  opts: GridOpts<T>,
) => {
  const { sequence, pxPerBeat, pxPerRow, snap, minSnap, scrollLeft, scrollTop, createElement, beatsPerMeasure } = opts;

  // FIXME(Vue3) With Vue 3, we can move to a set I think
  const selected: boolean[] = [];
  let holdingShift = false;
  const sequencerLoopEnd = ref(0);
  const disposers = new Set<Disposer>();

  const mousedown = (e: MouseEvent) => {
    const generalDisposer = addEventListeners({
      mousemove: () => {
        disposers.delete(generalDisposer);
        generalDisposer.dispose();
      },
      mouseup: () => {
        generalDisposer.dispose();
        disposers.delete(generalDisposer);
        addElement(e, (createElement as any).value());
      },
    });

    disposers.add(generalDisposer);

    if (opts.tool.value === 'pointer') {
      selectStart.value = e;
      const disposer = addEventListeners({
        mousemove: (event: MouseEvent) => {
          selectCurrent.value = event;
        },
        mouseup: () => {
          selectStart.value = null;
          selectCurrent.value = null;
          disposers.delete(disposer);
          disposer.dispose();
        },
      });

      disposers.add(disposer);
    } else if (opts.tool.value === 'slicer') {
      const rect = opts.getPosition();

      const calculatePos = (event: MouseEvent) => {
        return {
            x: calculateSimpleSnap({
            value: event.clientX - rect.left,
            altKey: event.altKey,
            minSnap: minSnap.value,
            snap: snap.value,
          }),
          y: event.clientY - rect.top,
        };
      };

      const { x: x1, y: y1 } = calculatePos(e);
      const disposer = addEventListeners({
        mousemove: (event: MouseEvent) => {
          const { x: x2, y: y2 } = calculatePos(event);
          sliceStyle.value =  {
            zIndex: 3,
            ...lineStyle({ x1, y1, x2, y2 }),
          };
        },
        mouseup: (event) => {
          const { x: x2, y: y2 } = calculatePos(event);

          const toAdd: T[] = [];
          sequence.value.forEach((element) => {
            const result = slice({
              row: element.row.value,
              time: element.time.value,
              duration: element.duration.value,
              pxPerBeat: pxPerBeat.value,
              rowHeight: pxPerRow.value,
              x1,
              y1,
              x2,
              y2,
            });

            if (result.result !== 'slice') {
              return;
            }

            const time = calculateSimpleSnap({
              value: result.time * pxPerBeat.value,
              altKey: event.altKey,
              minSnap: minSnap.value,
              snap: snap.value,
            }) / pxPerBeat.value;

            const newEl = element.slice(time);

            if (newEl) {
              toAdd.push(newEl as T);
            }
          });

          sequence.value.add(...toAdd);
          selected.push(...toAdd.map(() => false));
          sliceStyle.value = null;

          disposers.delete(disposer);
          disposer.dispose();
        },
      });

      disposers.add(disposer);
    }
  };

  // disposers.add(addEventListener('mousedown', (e) => {
  //   mousedown(e);
  // }));

  const checkLoopEnd = () => {
    // Set the minimum to 1 measure!
    const maxTime = Math.max(
      ...sequence.value.map((item) => item.time.value + item.duration.value),
      beatsPerMeasure.value,
    );

    const newLoopEnd = Math.ceil(maxTime / beatsPerMeasure.value) * beatsPerMeasure.value;

    if (newLoopEnd !== sequencerLoopEnd.value) {
      sequencerLoopEnd.value = newLoopEnd;
    }
  };

  const displayBeats = computed(() => {
    return Math.max(
      256, // 256 is completly random
      (sequencerLoopEnd.value || 0) + beatsPerMeasure.value * 2,
    );
  });

  watch(() => sequence.value.elements, () => {
    if (selected.length !== sequence.value.elements.length) {
      sequence.value.forEach((_, i) => selected[i] = false);
    }

    checkLoopEnd();
  });

  const addElement = (e: MouseEvent, el: T | undefined) => {
    if (!el) {
      return;
    }

    if (selected.some((value) => value)) {
      selected.forEach((_, i) => selected[i] = false);
      return;
    }

    const rect = opts.getPosition();
    const time = doSnap({
      position: e.clientX,
      minSnap: minSnap.value,
      snap: snap.value,
      pxPerBeat: pxPerBeat.value,
      offset: rect.left,
      scroll: scrollLeft.value,
      altKey: e.altKey,
    });

    const row = doSnap({
      position: e.clientY,
      minSnap: 1,
      snap: 1,
      pxPerBeat: pxPerRow.value,
      offset: rect.top,
      scroll: scrollTop.value,
      altKey: false, // irrelevant
    });

    el.row.value = row;
    el.time.value = time;

    opts.sequence.value.add(el);
    selected.push(false);
  };

  let initialMoveBeat: undefined | number;
  const move = (i: number, e: MouseEvent) => {
    if (initialMoveBeat === undefined) {
      return;
    }

    const el = sequence.value.elements[i];
    const rect = opts.getPosition();

    const time = doSnap({
      position: e.clientX,
      offset: rect.left,
      scroll: scrollLeft.value,
      altKey: e.altKey,
      snap: snap.value,
      minSnap: minSnap.value,
      pxPerBeat: pxPerBeat.value,
    });

    const row = doSnap({
      position: e.clientY,
      offset: rect.top,
      scroll: scrollTop.value,
      altKey: false, // irrelevant
      snap: 1,
      minSnap: 1,
      pxPerBeat: pxPerRow.value,
    });

    const timeDiff = time - initialMoveBeat;
    const rowDiff = row - el.row.value;

    let itemsToMove: Array<SchedulableTemp<any, any>>;
    if (selected[i]) {
      itemsToMove = sequence.value.filter((_, ind) => selected[ind]);
    } else {
      itemsToMove = [el];
    }

    if (itemsToMove.some((item) => item.time.value + timeDiff < 0 || item.row.value + rowDiff < 0)) {
      return;
    }

    initialMoveBeat = time;

    itemsToMove.forEach((item) => {
      item.time.value = item.time.value + timeDiff;
      item.row.value = item.row.value + rowDiff;
    });

    checkLoopEnd();
  };

  const updateAttr = (i: number, value: number, attr: 'offset' | 'duration') => {
    const el = sequence.value.elements[i];
    const diff = value - el[attr].value;

    const toUpdate = [el];
    if (selected[i]) {
      sequence.value.forEach((element, index) => {
        if (selected[index] && el !== element) {
          toUpdate.push(element);
        }
      });
    }

    // If the diff is less than zero, make sure we aren't setting the offset of
    // any of the elments to < 0
    if (diff < 0 && toUpdate.some((element) => (element[attr].value + diff) < 0)) {
      return;
    }

    toUpdate.forEach((element) => {
      element[attr].value += diff;
    });
  };

  const select = (e: MouseEvent, i: number) => {
    const item = sequence.value.elements[i];
    if (!selected[i]) {
      sequence.value.forEach((_, ind) => selected[ind] = false);
    }

    const createItem = (oldItem: T, isSelected: boolean) => {
      const newItem = oldItem.copy();

      // We set selected to true because `newNew` will have a higher z-index
      // Thus, it will be displayed on top (which we want)
      // Try copying selected files and you will notice the selected notes stay on top
      selected.push(isSelected);
      sequence.value.add(newItem as T);
    };

    if (holdingShift) {
      // If selected, copy all selected. If not, just copy the item that was clicked.
      if (selected[i]) {
        // selected is all all selected except the element you pressed on
        sequence.value.forEach((el, ind) => {
          if (!selected[ind]) {
            return;
          }

          if (el === item) {
            // A copy of `item` will be created at this index which becomes the target for moving
            i = sequence.value.elements.length;
          }

          // Set old item selected -> false and new item selected -> true since
          // the new items will be placed over the old elements
          selected[ind] = false;
          createItem(el, true);
        });
      } else {
        i = sequence.value.elements.length;
        createItem(item, false);
      }
    }

    document.documentElement.style.cursor = 'move';
    const rect = opts.getPosition();
    initialMoveBeat = doSnap({
      position: e.clientX,
      offset: rect.left,
      scroll: scrollLeft.value,
      altKey: e.altKey,
      snap: snap.value,
      minSnap: minSnap.value,
      pxPerBeat: pxPerBeat.value,
    });

    const disposer = addEventListeners({
      mousemove: (event) => move(i, event),
      mouseup: () => {
        document.documentElement.style.cursor = 'auto';
        initialMoveBeat = undefined;
        disposer.dispose();
        disposers.delete(disposer);
      },
    });

    disposers.add(disposer);
  };

  const onMounted = () => {
    disposers.add(addEventListeners({
      keydown: (e) => {
        if (e.keyCode === Keys.Shift) {
          holdingShift = true;
        } else if (e.keyCode === Keys.Delete || e.keyCode === Keys.Backspace) {
          // Slice and reverse sItemince we will be deleting from the array as we go
          let i = sequence.value.elements.length - 1;
          for (const _ of reverse(sequence.value.elements)) {
            if (selected[i]) {
              removeAtIndex(i);
            }
            i--;
          }
        }
      },
      keyup: (e) => {
        if (e.keyCode === Keys.Shift) {
          holdingShift = false;
        }
      },
    }));
  };

  const removeAtIndex = (i: number) => {
    const el = sequence.value.elements[i];
    el.remove();
    selected.splice(i, 1);
  };

  const remove = (i: number, e: MouseEvent) => {
    e.preventDefault();
    removeAtIndex(i);
  };

  const dispose = () => {
    disposers.forEach((disposer) => {
      disposer.dispose();
    });

    disposers.clear();
  };

  const onUnmounted = () => {
    dispose();
  };

  const selectStart = ref<MouseEvent>(null);
  const selectCurrent = ref<MouseEvent>(null);
  const sliceStyle = ref<Line & { zIndex: number }>(null);

  const selectStyle = computed(() => {
    if (!selectStart.value) { return; }
    if (!selectCurrent.value) {
      selected.forEach((_, i) => selected[i] = false);
      return;
    }

    const rect = opts.getPosition();
    const left = Math.min(selectStart.value.clientX - rect.left, selectCurrent.value.clientX - rect.left);
    const top = Math.min(selectStart.value.clientY - rect.top, selectCurrent.value.clientY - rect.top);
    const width = Math.abs(selectCurrent.value.clientX - selectStart.value.clientX);
    const height = Math.abs(selectCurrent.value.clientY - selectStart.value.clientY);

    // these are exact numbers BTW, not integers
    const minBeat = left / pxPerBeat.value;
    const minRow = top / pxPerRow.value;
    const maxBeat = (left + width) / pxPerBeat.value;
    const maxRow = (top + height) / pxPerRow.value;

    sequence.value.forEach((item, i) => {
      // Check if there is any overlap between the rectangles
      // https://www.geeksforgeeks.org/find-two-rectangles-overlap/
      if (minRow > item.row.value + 1 || item.row.value > maxRow) {
        selected[i] = false;
      } else if (minBeat > item.time.value + item.duration.value || item.time.value > maxBeat) {
        selected[i] = false;
      } else {
        selected[i] = true;
      }
    });

    return {
      borderRadius: '5px',
      border: 'solid 1px red',
      backgroundColor: 'rgba(255, 51, 51, 0.3)',
      left: `${left}px`,
      top: `${top}px`,
      height: `${height}px`,
      width: `${width}px`,
      zIndex: 3,
    };
  });

  return {
    selectStyle,
    sliceStyle,
    selected,
    move,
    updateOffset(i: number, value: number) {
      updateAttr(i, value, 'offset');
    },
    updateDuration(i: number, value: number) {
      updateAttr(i, value, 'duration');

      // Make sure to check the loop end when the duration of an element has been changed!!
      checkLoopEnd();
    },
    remove,
    select,
    sequencerLoopEnd,
    displayBeats,
    onMounted,
    onUnmounted,
    dispose,
    add: (e: MouseEvent) => {
      addElement(e, opts.createElement.value ? (opts.createElement as any).value() : undefined);
    },
    mousedown,
  };
};
