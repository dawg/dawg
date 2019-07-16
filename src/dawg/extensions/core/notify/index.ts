import { events, NotificationConfig } from './events';
import { ui } from '@/dawg/ui';
import Notifications from '@/dawg/extensions/core/notify/Notifications.vue';
import { manager } from '@/dawg/extensions/manager';

interface NotificationFunctions {
  info(message: string, params?: NotificationConfig): void;
  success(message: string, params?: NotificationConfig): void;
  warning(message: string, params?: NotificationConfig): void;
  error(message: string, params?: NotificationConfig): void;
}

export const notify = manager.activate({
  id: 'dawg.notify',
  activate() {
    ui.global.push(Notifications);

    const functions: NotificationFunctions = {
      info(message, params) {
        params = params || {};
        events.emit('add', { message, params, type: 'info', icon: 'info-circle' });
      },
      success(message, params) {
        params = params || {};
        events.emit('add', { message, params, type: 'success', icon: 'check' });
      },
      warning(message, params) {
        params = params || {};
        events.emit('add', { message, params, type: 'warning', icon: 'exclamation-triangle' });
      },
      error(message, params) {
        params = params || {};
        events.emit('add', { message, params, type: 'error', icon: 'ban' });
      },
    };

    return functions;
  },
});
