import * as dawg from '@/dawg';
import AudioFiles from '@/dawg/extensions/extra/audio-files/AudioFiles.vue';

export const extension: dawg.Extension = {
  id: 'dawg.audio-files',
  activate() {
    dawg.ui.activityBar.push({
      icon: 'queue_music',
      name: 'Audio Files',
      component: AudioFiles,
    });
  },
};
