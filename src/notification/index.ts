import Notifications from './Notifications.vue';
import { events, Params } from './events';

interface Config {
    name?: string;
}

const Notify = {
  install(Vue: any, args: Config = {}) {

    Vue.component('notifications', Notifications);

    const info = (message: string, params?: Params) => {
        params = params || {};
        events.$emit('add', {message, params, type: 'info', icon: 'info-circle'});
    };

    const success = (message: string, params?: Params) => {
      params = params || {};
      events.$emit('add', {message, params, type: 'success', icon: 'check'});
    };

    const warning = (message: string, params?: Params) => {
      params = params || {};
      events.$emit('add', {message, params, type: 'warning', icon: 'exclamation-triangle'});
    };

    const error = (message: string, params?: Params) => {
      params = params || {};
      events.$emit('add', {message, params, type: 'error', icon: 'ban'});
    };

    const name = args.name ? args.name : 'notify';

    Vue.prototype['$' + name] = {info, success, error, warning};
    Vue[name] = {info, success, error, warning};
  },
};

export default Notify;
