<template>
  <div class="flex flex-col" :class="framework.ui.rootClasses">
    <split direction="vertical" name="Root">

      <split direction="horizontal" resizable name="Everything">
        <split :initial="framework.ui.ACTIVITY_BAR_SIZE" fixed name="Activity Bar">
          <activity-bar @open-settings="openSettings"></activity-bar>
        </split>

        <split 
          collapsible 
          :min-size="100"
          :initial.sync="sideBarSize"
          :collapsed.sync="sideBarCollapsed"
          name="Side Tabs"
        >
          <side-tabs 
            v-if="loaded"
            :toolbar-height="framework.ui.TOOLBAR_SIZE"
            class="border-r border-default-darken-3"
          ></side-tabs>
          <blank v-else></blank>
        </split>

        <split direction="vertical" resizable name="Right Stuff">
          <split :initial="framework.ui.TOOLBAR_SIZE" fixed name="Toolbar">
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

          <split name="Main Component">
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
            collapsible
            :min-size="100"
            :initial.sync="panelsSize"
            :collapsed.sync="panelsCollapsed"
            name="Panel"
          >
            <split :initial="55" fixed name="Panel Headers">
              <panel-headers></panel-headers>
            </split>
            <split name="Panel Content">
              <panels v-if="loaded"></panels>
              <blank v-else></blank>
            </split>
          </split>
        </split>
      </split>
      <split :initial="framework.ui.STATUS_BAR_SIZE" fixed name="Status Bar">

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
import * as framework from '@/framework';
import { sortOrdered } from '@/utils';
import { createComponent, computed, ref, onMounted, onUnmounted } from '@vue/composition-api';
export default createComponent({
  components: {
    Panels,
    PanelHeaders,
    ActivityBar,
  },
  name: 'App',
  setup() {
    const settings = ref(false);
    // This loaded flag is important
    // Bugs can appear if we render before we load the project file
    // This occurs because some components mutate objects
    // However, they do not reapply their mutations
    // ie. some components expect props to stay the same.
    const loaded = ref(false);
    const mainComponent = computed(() => {
      if (framework.ui.mainSection.length) {
        return framework.ui.mainSection[framework.ui.mainSection.length - 1];
      }
    });
    const toolbarLeft = computed(() => {
      return framework.ui.toolbar.filter((item) => item.position === 'left').sort(sortOrdered);
    });
    const toolbarRight = computed(() => {
      return framework.ui.toolbar.filter((item) => item.position === 'right').sort(sortOrdered).reverse();
    });
    const lineStyle = computed(() => {
      return `border-left: 1px solid ${framework.theme['text-default']}`;
    });
    const statusBarRight = computed(() => {
      return framework.ui.statusBar.filter((item) => item.position === 'right').sort(sortOrdered).reverse();
    });
    const statusBarLeft = computed(() => {
      return framework.ui.statusBar.filter((item) => item.position === 'left').sort(sortOrdered);
    });
    function online() {
      framework.notify.info('Connection has been restored');
    }
    function offline() {
      framework.notify.warning('You are disconnected', {
        detail: 'Features may not work as expected.',
      });
    }
    function openSettings() {
      settings.value = true;
    }
    // This is called before refresh / close
    // I don't remove this listner because the window is closing anyway
    // I'm not even sure onExit would be called if we removed it in the destroy method
    window.addEventListener('beforeunload', framework.manager.dispose);
    // FIXME
    // automation.$on('automate', this.addAutomationClip);
    setTimeout(async () => {
      // Log this for debugging purposes
      (window as any).framework = framework;
      loaded.value = true;
    }, 1250);
    onMounted(() => {
      window.addEventListener('offline', offline);
      window.addEventListener('online', online);
      // The offline event is not fired if initially disconnected
      if (!navigator.onLine) {
        offline();
      }
    });
    onUnmounted(() => {
      window.removeEventListener('offline', offline);
      window.removeEventListener('online', online);
    });
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
    return {
      settings,
      loaded,
      sideBarSize: framework.ui.sideBarSize,
      panelsSize: framework.ui.panelsSize,
      sideBarCollapsed: framework.ui.sideBarCollapsed,
      panelsCollapsed: framework.ui.panelsCollapsed,
      mainComponent,
      toolbarLeft,
      toolbarRight,
      lineStyle,
      statusBarRight,
      statusBarLeft,
      openSettings,
      framework,
    };
  },
});
</script>
