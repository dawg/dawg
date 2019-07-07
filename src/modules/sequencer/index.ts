import Vue, { VueConstructor } from 'vue';
import Sequencer from '@/modules/sequencer/Sequencer.vue';
import PE from '@/modules/sequencer/PatternElement.vue';
import SE from '@/modules/sequencer/SampleElement.vue';
import PlaylistSequencer from '@/modules/sequencer/PlaylistSequencer.vue';
import ACE from '@/modules/sequencer/AutomationClipElement.vue';
import Waveform from '@/modules/dawg/Waveform.vue';
import Scroller from '@/modules/sequencer/Scroller.vue';
import { positionable, resizable, selectable, colored } from '@/modules/sequencer/helpers';

export const createElement = (o: VueConstructor) => {
  return positionable(resizable(selectable(o)));
};

export const SampleElement = createElement(colored(SE));
export const PatternElement = createElement(colored(PE));
export const AutomationClipElement = createElement(colored(ACE));

export {
  Sequencer,
  colored,
};


export default {
  install() {
    Vue.component('PatternElement', PatternElement);
    Vue.component('SampleElement', SampleElement);
    Vue.component('PlaylistSequencer', PlaylistSequencer);
    Vue.component('AutomationClipElement', AutomationClipElement);
    Vue.component('Scroller', Scroller);
    Vue.component('Waveform', Waveform);
  },
};
