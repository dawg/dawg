import Notifications from './Notifications.vue'
import { events }    from './events'

interface Config {
    name?: string;
}

interface Params {
      detail?: string;
      dismissible?: boolean;
}

interface Notification {
  message: string;
  params: Params;
}


const Notify = {
  install(Vue: any, args: Config = {}) {

    Vue.component('notifications', Notifications)

    const info = (message: string, params?: Params) => {
        params = params || {};
        events.$emit('add', {message, params, type: "error"})
    };

    const name = args.name ? args.name : 'notify'

    Vue.prototype['$' + name] = {info}
    Vue[name] = {info}
  }
}

export default Notify
