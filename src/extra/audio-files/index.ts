import Vue, { VueConstructor } from 'vue';
import * as dawg from '@/dawg';
import AudioFiles from '@/extra/audio-files/AudioFiles.vue';

export const extension: dawg.Extension = {
  id: 'dawg.audio-files',
  activate() {
    dawg.ui.activityBar.push({
      icon: 'queue_music',
      name: 'Audio Files',
      // We have to do this because of the composition API
      // FIXME
      component: AudioFiles as VueConstructor<Vue>,
      order: 3,
    });
  },
};
