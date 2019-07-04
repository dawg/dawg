import * as dawg from '@/dawg';
import AutomationClips from '@/dawg/extensions/extra/clips/AutomationClips.vue';
import { general } from '@/store';

export const extension: dawg.Extension = {
  id: 'dawg.clips',
  activate() {
    dawg.ui.activityBar.push({
      icon: 'share',
      name: 'Automation Clips',
      component: AutomationClips,
      iconProps: { style: 'transform: rotate(-90deg)' },
    });
  },
};
