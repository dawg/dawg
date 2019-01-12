import Notifications from './Notifications.vue';
import { events, NotificationConfig } from './events';

interface NotifyConfig {
  name?: string;
}

interface NotificationFunctions {
  info(message: string, params?: NotificationConfig): void;
  success(message: string, params?: NotificationConfig): void;
  warning(message: string, params?: NotificationConfig): void;
  error(message: string, params?: NotificationConfig): void;
}

export interface NotifyInterface {
  $notify: NotificationFunctions;
}

const notifications: NotificationFunctions = {
  info(message, params) {
    params = params || {};
    events.$emit('add', { message, params, type: 'info', icon: 'info-circle' });
  },
  success(message, params) {
    params = params || {};
    events.$emit('add', { message, params, type: 'success', icon: 'check' });
  },
  warning(message, params) {
    params = params || {};
    events.$emit('add', { message, params, type: 'warning', icon: 'exclamation-triangle' });
  },
  error(message, params) {
    params = params || {};
    events.$emit('add', { message, params, type: 'error', icon: 'ban' });
  },
};



const Notify = {
  install(Vue: any, args: NotifyConfig = {}) {

    Vue.component('notifications', Notifications);
    const name = args.name ? args.name : 'notify';

    Vue.prototype['$' + name] = notifications;
  },
};

export default Notify;
