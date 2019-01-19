import Vuetify from 'vuetify';
import Icon from 'vue-awesome/components/Icon.vue';
import Vue from 'vue';
import 'vuetify/dist/vuetify.css';
import 'vue-awesome/icons';
import '@/styles/global.sass';
import { remote } from 'electron';
import TooltipIcon from '@/components/TooltipIcon.vue';
import Context from '@/modules/context';
import Notification from '@/modules/notification';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import storybook from '@/storybook';

const inspect = {
  text: 'Inspect',
  callback: (e: MouseEvent) => {
    // Wait for context menu to close before opening the Dev Tools!
    // If you don't, it will focus on the context menu.
    setTimeout(() => {
      const window = remote.getCurrentWindow();
      window.webContents.inspectElement(e.x, e.y);
      if (window.webContents.isDevToolsOpened()) {
        window.webContents.devToolsWebContents.focus();
      }
    }, 1000);
  },
};

const middleware = () => {
  Vue.use(Vuetify, {theme: false});
  Vue.use(Context, { default: [inspect] });
  Vue.component('icon', Icon);
  Vue.use(Notification);
  Vue.component('VuePerfectScrollbar', VuePerfectScrollbar);
  Vue.component('TooltipIcon', TooltipIcon);

  storybook();

  // This imports all .vue files in the components folder
  // See https://vuejs.org/v2/guide/components-registration.html
  const components = require.context(
    './components',
    // Whether or not to look in subfolders
    false,
    /\w+\.vue$/,
  );

  components.keys().forEach((fileName) => {
    // Get component config
    const componentConfig = components(fileName);

    // Get PascalCase name of component
    const componentName = fileName.slice(2, fileName.length - 4);

    // Register component globally
    Vue.component(
      componentName,
      // Look for the component options on `.default`, which will
      // exist if the component was exported with `export default`,
      // otherwise fall back to module's root.
      componentConfig.default || componentConfig,
    );
  });
};

export default middleware;
