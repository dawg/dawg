import * as dawg from '@/dawg';
import VersionModal from '@/extra/versions/VersionModal.vue';
import { ref, createComponent } from '@vue/composition-api';
import Vue from 'vue';

export const extension = dawg.createExtension({
  id: 'dawg.versions',
  activate(context) {
    const show = ref(false);
    dawg.ui.global.push(Vue.extend(createComponent({
      components: { VersionModal },
      template: `<version-modal v-model="show"></version-modal>`,
      props: {},
      setup() {
        return { show };
      },
    })));

    const item = dawg.menubar.defineMenuBarItem({
      menu: 'Application',
      section: '0_commands',
      callback: () => show.value = true,
      text: 'About DAWG',
    });

    context.subscriptions.push(dawg.menubar.addToMenu(item));
    context.subscriptions.push(dawg.commands.registerCommand(item));
  },
});
