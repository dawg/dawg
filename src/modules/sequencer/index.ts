import Vue from 'vue';
import Sequencer from '@/modules/sequencer/Sequencer.vue';
import PatternElement from '@/modules/sequencer/PatternElement.vue';
import SampleElement from '@/modules/sequencer/SampleElement.vue';
import PlaylistSequencer from '@/modules/sequencer/PlaylistSequencer.vue';
import AutomationClipElement from '@/modules/sequencer/AutomationClipElement.vue';
import Waveform from '@/components/Waveform.vue';
import Scroller from '@/modules/sequencer/Scroller.vue';

export {
  Sequencer,
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
