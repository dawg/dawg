import Vue, { VueConstructor } from 'vue';
import Sequencer from '@/modules/sequencer/Sequencer.vue';
import PE from '@/modules/sequencer/PatternElement.vue';
import SE from '@/modules/sequencer/SampleElement.vue';
import PlaylistSequencer from '@/modules/sequencer/PlaylistSequencer.vue';
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


export default {
  install() {
    Vue.component('Note', Note);
    Vue.component('PatternElement', PatternElement);
    Vue.component('SampleElement', SampleElement);
    Vue.component('PlaylistSequencer', PlaylistSequencer);
  },
};
