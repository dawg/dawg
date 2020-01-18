<template>
  <div class="flex flex-col" :class="framework.ui.rootClasses">
    <split direction="vertical">

      <split direction="horizontal" resizable>
        <split :initial="65" fixed>
          <activity-bar @open-settings="openSettings"></activity-bar>
        </split>

        <split 
          collapsible 
          :min-size="100"
          :initial.sync="framework.ui.sideBarSize.value"
        >
          <side-tabs 
            v-if="loaded"
            class="border-r border-default-darken-3"
          ></side-tabs>
          <blank v-else></blank>
        </split>

        <split direction="vertical" resizable>
          <split :initial="TOOLBAR_HEIGHT" fixed>
            <div class="bg-default h-full px-5 flex items-center border-b border-default-darken-3">
              <logo class="text-default"></logo>
              <div class="text-default border-l mx-6" style="height: 60%"></div>

              <component
                v-for="(item, i) in toolbarLeft"
                :key="`toolbar-left-${i}`"
                :is="item.component"
              ></component>

              <div class="flex-grow drag-area"></div>

              <component
                v-for="(item, i) in toolbarRight"
                :key="`toolbar-right-${i}`"
                :is="item.component"
              ></component>
            </div>
          </split>

          <split>
            <component
              v-if="loaded"
              :is="mainComponent"
              style="height: 100%"
            ></component>
            <blank v-else></blank>              
          </split>

          <split
            direction="vertical"
            class="bg-default border-t border-default-darken-3"
            keep
            :initial.sync="framework.ui.panelsSize.value"
          >
            <split :initial="55" fixed>
              <panel-headers></panel-headers>
            </split>
            <split>
              <panels v-if="loaded"></panels>
              <blank v-else></blank>
            </split>
          </split>
        </split>
      </split>
      <split :initial="STATUS_BAR_HEIGHT" fixed>

        <div class="bg-primary h-full flex items-center position text-default">
          <div
            v-for="(item, i) in statusBarLeft"
            class="ml-6"
            :key="`status-bar-left-${i}`" 
          ><component :is="item.component"></component></div>

          <div style="flex: 1"></div>

          <div
            v-for="(item, i) in statusBarRight"
            class="mr-6"
            :key="`status-bar-right-${i}`"
          ><component :is="item.component"></component></div>
        </div>

      </split>
    </split>
    <settings v-model="settings"></settings>
    <component
      v-for="(global, i) in framework.ui.global"
      :key="i"
      :is="global"
    ></component>
    <loading 
      class="bg-default"
      :value="!loaded"
    ></loading>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Panels from '@/components/Panels.vue';
import PanelHeaders from '@/components/PanelHeaders.vue';
import ActivityBar from '@/components/ActivityBar.vue';
import { TOOLBAR_HEIGHT, STATUS_BAR_HEIGHT } from '@/constants';
import * as framework from '@/framework';
import { sortOrdered } from '@/utils';
import * as dawg from '@/dawg';

@Component({
  components: {
    Panels,
    PanelHeaders,
    ActivityBar,
  },
})
export default class App extends Vue {
  public TOOLBAR_HEIGHT = TOOLBAR_HEIGHT;
  public STATUS_BAR_HEIGHT = STATUS_BAR_HEIGHT;
  public framework = framework;
  public settings = false;

  // This loaded flag is important
  // Bugs can appear if we render before we load the project file
  // This occurs because some components mutate objects
  // However, they do not reapply their mutations
  // ie. some components expect props to stay the same.
  public loaded = false;

  get mainComponent() {
    if (framework.ui.mainSection.length) {
      return framework.ui.mainSection[framework.ui.mainSection.length - 1];
    }
  }

  get toolbarLeft() {
    return framework.ui.toolbar.filter((item) => item.position === 'left').sort(sortOrdered);
  }

  get toolbarRight() {
    return framework.ui.toolbar.filter((item) => item.position === 'right').sort(sortOrdered).reverse();
  }

  get lineStyle() {
    return `border-left: 1px solid ${framework.theme['text-default']}`;
  }

  get statusBarRight() {
    return framework.ui.statusBar.filter((item) => item.position === 'right').sort(sortOrdered).reverse();
  }

  get statusBarLeft() {
    return framework.ui.statusBar.filter((item) => item.position === 'left').sort(sortOrdered);
  }

  public async created() {
    // This is called before refresh / close
    // I don't remove this listner because the window is closing anyway
    // I'm not even sure onExit would be called if we removed it in the destroy method
    window.addEventListener('beforeunload', framework.manager.dispose);

    // FIXME
    // automation.$on('automate', this.addAutomationClip);

    setTimeout(async () => {
      // Log this for debugging purposes
      (window as any).framework = framework;
      (window as any).dawg = dawg;
      this.loaded = true;
    }, 1250);
  }

  public mounted() {
    window.addEventListener('offline', this.offline);
    window.addEventListener('online', this.online);

    // The offline event is not fired if initially disconnected
    if (!navigator.onLine) {
      this.offline();
    }
  }

  public destroyed() {
    window.removeEventListener('offline', this.offline);
    window.removeEventListener('online', this.online);
  }

  public online() {
    framework.notify.info('Connection has been restored');
  }

  public offline() {
    framework.notify.warning('You are disconnected', {
      detail: 'Features may not work as expected.',
    });
  }

  public openSettings() {
    this.settings = true;
  }

  // public async addAutomationClip<T extends Automatable>(automatable: T, key: keyof T & string) {
    // FIXME Fix automation clips
    // const added = await ddd.project.createAutomationClip({
    //   automatable,
    //   key,
    //   start: this.masterStart,
    //   end: this.masterEnd,
    // });

    // if (!added) {
    //   framework.notify.warning('Unable to create automation clip', {
    //     detail: 'There are no free tracks. Move elements and try again.',
    //   });
    // }
  // }
}
</script>
