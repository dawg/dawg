import { VueConstructor } from 'vue';
import Sequencer from '@/modules/sequencer/Sequencer.vue';
import PE from '@/modules/sequencer/PatternElement.vue';
import SE from '@/modules/sequencer/SampleElement.vue';
import N from '@/modules/sequencer/Note.vue';
import { positionable, resizable, selectable } from './sequencer';

function hoc(o: VueConstructor) {
  return positionable(selectable(resizable(o)));
}

export const SampleElement = hoc(SE);
export const PatternElement = hoc(PE);
export const Note = hoc(N);

export {
  Sequencer,
  positionable,
  resizable,
  selectable,
};
