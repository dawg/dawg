import Notifications from '@/core/notify/Notifications.vue';
import * as framework from '@/lib/framework';

export const notify = framework.manager.activate({
  id: 'dawg.notify',
  activate() {
    framework.ui.global.push(Notifications);
    return framework.notify;
  },
});
