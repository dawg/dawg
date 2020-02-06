import Vue from 'vue';
import Sequencer from '@/sequencer/Sequencer.vue';
import PatternElement from '@/sequencer/PatternElement.vue';
import SampleElement from '@/sequencer/SampleElement.vue';
import PlaylistSequencer from '@/sequencer/PlaylistSequencer.vue';
import AutomationClipElement from '@/sequencer/AutomationClipElement.vue';
import Waveform from '@/components/Waveform.vue';
import Scroller from '@/sequencer/Scroller.vue';

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
