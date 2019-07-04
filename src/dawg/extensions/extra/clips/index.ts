import * as dawg from '@/dawg';
import AudioFiles from '@/dawg/extensions/extra/clips/AudioFiles.vue';

export const extension: dawg.Extension = {
  id: 'dawg.clips',
  activate() {
    dawg.ui.activityBar.push({
      icon: 'queue_music',
      name: 'Audio Files',
      component: AudioFiles,
    });
  },
};
