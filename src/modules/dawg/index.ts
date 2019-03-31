import Vue from 'vue';
import Toolbar from '@/modules/dawg/Toolbar.vue';
import Slider from '@/modules/dawg/Slider.vue';
import MiniScore from '@/modules/dawg/MiniScore.vue';
import Dawg from '@/modules/dawg/Dawg.vue';
import VerticalSwitch from '@/modules/dawg/VerticalSwitch.vue';
import Blank from '@/modules/dawg/Blank.vue';
import Loading from '@/modules/dawg/Loading.vue';
import Waveform from '@/modules/dawg/Waveform.vue';
import Spectrogram from '@/modules/dawg/Spectrogram.vue';

export default  {
  install() {
    Vue.component('Toolbar', Toolbar);
    Vue.component('Slider', Slider);
    Vue.component('MiniScore', MiniScore);
    Vue.component('Dawg', Dawg);
    Vue.component('VerticalSwitch', VerticalSwitch);
    Vue.component('Blank', Blank);
    Vue.component('Loading', Loading);
    Vue.component('Waveform', Waveform);
    Vue.component('Spectrogram', Spectrogram);
  },
};


