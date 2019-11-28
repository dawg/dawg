import Notifications from '@/dawg/extensions/core/notify/Notifications.vue';
import { manager } from '@/base/manager';
import * as base from '@/base';

export const notify = manager.activate({
  id: 'dawg.notify',
  activate() {
    base.ui.global.push(Notifications);
    return base.notify;
  },
});
