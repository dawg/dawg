import { Ref, watch, ref } from '@vue/composition-api';
import { SchedulableTemp, Sequence } from '@/models';
import { addEventListeners } from '@/lib/events';
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

type Element = SchedulableTemp<any, any>;

export interface PlacementSnapOpts {
  position: number;
  minSnap: number;
  snap: number;
  pxPerBeat: number;
  offset: number;
}

export const doSnap = (
  opts: PlacementSnapOpts,
) => {
  return 0;
  // const rect = opts.reference.getBoundingClientRect();

  // // The amount of pixels that the mouse is from the edge of the of grid
  // const pxMouseFromLeft =
  //   (opts.vert ? opts.event.clientY : opts.event.clientX) -
  //   (opts.vert ? rect.top : rect.left) +
  //   ((opts.vert ? opts.reference.scrollTop : opts.reference.scrollLeft) ?? 0);

  // return calculateSimpleSnap({
  //   value: pxMouseFromLeft,
  //   altKey: opts.event.altKey,
  //   minSnap: opts.minSnap,
  //   snap: opts.snap,
  //   pxPerBeat: opts.pxPerBeat,
  //   round: Math.floor,
  // });
};

export interface GridOpts<T extends Element> {
  sequence: Ref<Sequence<T>>;
  pxPerBeat: Ref<number>;
  pxPerRow: Ref<number>;
  snap: Ref<number>;
  minSnap: Ref<number>;
  scrollLeft: Ref<number>;
  scrollTop: Ref<number>;
  beatsPerMeasure: Ref<number>;
  createElement: Ref<() => Element>;
  tool: Ref<'pointer' | 'slicer'>;
  getBoundingClientRect: () => { left: number, top: number };
}

export const createGrid = <T extends Element>(
  opts: GridOpts<T>,
) => {
  const { sequence, pxPerBeat, pxPerRow, snap, minSnap, scrollLeft, scrollTop, createElement, beatsPerMeasure } = opts;
  let selected: boolean[] = [];
  let holdingShift = false;
  const itemLoopEnd = ref(0);

  const checkLoopEnd = () => {
    // Set the minimum to 1 measure!
    const maxTime = Math.max(
      ...sequence.value.map((item) => item.time.value + item.duration.value),
      beatsPerMeasure.value,
    );

    const newLoopEnd = Math.ceil(maxTime / beatsPerMeasure.value) * beatsPerMeasure.value;

    if (newLoopEnd !== itemLoopEnd.value) {
      // TODO
      // this.$update('sequencerLoopEnd', itemLoopEnd);
      itemLoopEnd.value = newLoopEnd;
    }
  };

  watch(sequence, () => {
    if (selected.length !== sequence.value.elements.length) {
      selected = sequence.value.map((_) => false);
    }

    checkLoopEnd();
  });

  const addElement = (e: MouseEvent, el: Element) => {
    if (selected.some((value) => value)) {
      selected.forEach((_, i) => selected[i] = false);
      return;
    }

    // const time = doSnap({
    //   position: e.clientX,
    //   minSnap: minSnap.value,
    //   snap: snap.value,
    //   pxPerBeat: pxPerBeat.value,
    //   reference: '',
    // });

    // const row = doSnap({
    //   event: e,
    //   minSnap: 1,
    //   snap: 1,
    //   pxPerBeat: pxPerRow.value,
    //   reference: this.$el,
    // });

    // el.row.value = row;
    // el.time.value = time;

    // selected[el.element.id] = false;
    // opts.sequence.add(el);
  };

  const move = (el: T, e: MouseEvent) => {
    if (!dragStartEvent) {
      return;
    }

    const i = sequence.value.indexOf(el);

    // Get the preVIOUS element first
    // and ALSO grab the current position
    const oldItem = sequence.value.elements[i];
    const rect = opts.getBoundingClientRect();

    // Get the start BEAT
    let startBeat = (dragStartEvent.clientX - rect.left) / pxPerBeat.value;
    startBeat = Math.floor(startBeat / snap.value) * snap.value;

    // Get the end BEAT
    let endBeat = (e.clientX - rect.left) / pxPerBeat.value;
    endBeat = Math.floor(endBeat / snap.value) * snap.value;

    // CHeck if we are going to move squares
    const diff = endBeat - startBeat;
    const time = oldItem.time.value + diff;
    if (time < 0) { return; }

    const y = e.clientY - rect.top;
    const row = Math.floor(y / pxPerRow.value);
    if (row < 0) { return; }

    if (row === oldItem.row.value && time === oldItem.time.value) { return; }
    // OK, so we've moved squares
    // Lets update our dragStartEvent or else
    // things will start to go haywyre :////
    dragStartEvent = e;

    const timeDiff = time - oldItem.time.value;
    const rowDiff = row - oldItem.row.value;

    let itemsToMove: Array<SchedulableTemp<any, any>>;
    if (selected[i]) {
      itemsToMove = sequence.value.filter((item, ind) => selected[ind]);
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

    checkLoopEnd();
  };

  const updateAttr = (el: T, value: number, attr: 'offset' | 'duration') => {
    const i = sequence.value.indexOf(el);
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

  let dragStartEvent: MouseEvent | null = null;
  const select = (e: MouseEvent, i: number) => {
    const item = sequence.value.elements[i];
    if (!selected[i]) {
      sequence.value.forEach((_, ind) => selected[ind] = false);
    }

    const createItem = (oldItem: T) => {
      const newItem = oldItem.copy();

      // We set selected to true because `newNew` will have a heigher z-index
      // Thus, it will be displayed on top (which we want)
      // Try copying selected files and you will notice the selected notes stay on top
      selected.push(true);
      sequence.value.add(newItem as T);
    };

    if (holdingShift) {
      let selectedElements: T[];

      // If selected, copy all selected. If not, just copy the item that was clicked.
      if (selected[i]) {
        // selected is all all selected except the element you pressed on
        selectedElements = sequence.value.filter((el, ind) => {
          if (selected[ind]) {
            // See in `createItem` that we are setting all new elements to selected
            // And accordingly we are setting selected to false here
            selected[ind] = false;
            return el !== item;
          } else {
            return false;
          }
        });
        // A copy of `item` will be created at this index
        // See the next line
        // TODO
        // targetIndex = sequence.value.elements.length;
        createItem(item);
      } else {
        selectedElements = [item];
      }

      selectedElements.forEach(createItem);
    }

    dragStartEvent = e;

    document.documentElement.style.cursor = 'move';
    const disposer = addEventListeners({
      mousemove: (event) => move(item, event),
      mouseup: () => {
        document.documentElement.style.cursor = 'auto';
        disposer.dispose();
      },
    });
  };

  let toDispose: Disposer[] = [];
  const onMounted = () => {
    toDispose.push(addEventListeners({
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
    const el = sequence.value.elements[0];
    el.remove();
    selected.splice(i, 1);
  };

  const remove = (el: T) => {
    const i = sequence.value.indexOf(el);
    removeAtIndex(i);
  };

  const onUnmounted = () => {
    toDispose.forEach((disposer) => disposer.dispose());
    toDispose = [];
  };

  const selectStartEvent = ref<MouseEvent>(null);
  const selectCurrentEvent = ref<MouseEvent>(null);
  const sliceStyle = ref<{ [k: string]: string | number }>(null);
  return {
    selectStartEvent,
    selectCurrentEvent,
    mousedown: (e: MouseEvent) => {
      const disposer1 = addEventListeners({
        mousemove: () => {
          disposer1.dispose();
        },
        mouseup: () => {
          disposer1.dispose();

          // TODO
          addElement(e, opts.createElement.value());
        },
      });

      if (opts.tool.value === 'pointer') {
        selectStartEvent.value = e;
        const disposer = addEventListeners({
          mousemove: (event: MouseEvent) => {
            selectCurrentEvent.value = event;
          },
          mouseup: () => {
            selectStartEvent.value = null;
            selectCurrentEvent.value = null;
            disposer.dispose();
          },
        });
      } else if (opts.tool.value === 'slicer') {
        const rect = opts.getBoundingClientRect();

        const calculatePos = (event: MouseEvent) => {
          return {
              x: calculateSimpleSnap({
              value: event.clientX - rect.left,
              altKey: event.altKey,
              minSnap: minSnap.value,
              snap: snap.value,
              pxPerBeat: pxPerBeat.value,
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
                pxPerBeat: pxPerBeat.value,
              }) / pxPerBeat.value;

              const newEl = element.slice(time);

              if (newEl) {
                toAdd.push(newEl as T);
              }
            });

            sequence.value.add(...toAdd);
            selected.push(...toAdd.map(() => false));
            sliceStyle.value = null;
            disposer.dispose();
          },
        });
      }
    },
    move,
    updateOffset(el: T, value: number) {
      updateAttr(el, value, 'offset');
    },
    updateDuration(el: T, value: number) {
      updateAttr(el, value, 'duration');

      // Make sure to check the loop end when the duration of an element has been changed!!
      checkLoopEnd();
    },
    remove,
    select,
    itemLoopEnd,
    onMounted,
    onUnmounted,
  };
};
