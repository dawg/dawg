import * as dawg from '@/dawg';
import AutomationClips from '@/extra/clips/AutomationClips.vue';
import { VueConstructor } from 'vue';

export const extension: dawg.Extension = {
  id: 'dawg.clips',
  activate() {
    dawg.ui.activityBar.push({
      icon: 'share',
      name: 'Automation Clips',
      // AutomationClips is exported using composition-api which causes type issues
      component: AutomationClips as any as VueConstructor,
      iconProps: { style: 'transform: rotate(-90deg)' },
      order: 4,
    });
  },
};
