<template>
  <!-- <div class="flex flex-col" :class="rootClasses">
    <split direction="vertical" name="Root">

      <split direction="horizontal" resizable name="Everything">
        <split :initial="framework.ui.ACTIVITY_BAR_SIZE" fixed name="Activity Bar">
          <activity-bar @open-settings="openSettings"></activity-bar>
        </split>

        <split 
          keep
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
            :class="{ 'ml-6': i !== 0, 'ml-3': i === 0 }"
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
  </div> -->
  <div>
    <button @click="start">
      START TESTING
    </button>
    <div class="controls">
      <div class="left">
        <div @click="play" class="button cursor-pointer" role="button">
          {{ text }}
        </div>
      </div>
      <div class="right">
        <span>Volume: </span>
        <input type="range" min="0.0" max="1.0" step="0.01"
            value="0.8" name="volume" v-model="volumeControl">
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// import Panels from '@/lib/framework/Panels.vue';
// import SideTabs from '@/lib/framework/SideTabs.vue';
// import PanelHeaders from '@/lib/framework/PanelHeaders.vue';
// import ActivityBar from '@/lib/framework/ActivityBar.vue';
// import * as framework from '@/lib/framework';
// import { sortOrdered, Keys } from '@/lib/std';
import { createComponent, computed, ref, onMounted, onUnmounted, watch } from '@vue/composition-api';
// import { getLogger } from '@/lib/log';
// import { ipcSender } from '@/lib/framework/ipc';
// import { useSubscriptions } from '@/lib/vutils';
// import { remote } from 'electron';
// import * as oly from '@/lib/olyger';
// import path from 'path';
import * as Audio from '@/lib/audio';
import { Disposer } from '../std';
import { Stopper } from '../audio/scheduled-source-node';
import { getContext } from '../audio/global';

// declare var __static: string;

// const logger = getLogger('App');

export default createComponent({
  // components: {
  //   Panels,
  //   PanelHeaders,
  //   ActivityBar,
  //   SideTabs,
  // },
  name: 'App',
  setup() {
    // const settings = ref(false);
    // const subscriptions = useSubscriptions();

    // // This loaded flag is important
    // // Bugs can appear if we render before we load the project file
    // // This occurs because some components mutate objects
    // // However, they do not reapply their mutations
    // // ie. some components expect props to stay the same.
    // const loaded = ref(false);

    // const mainComponent = computed(() => {
    //   if (framework.ui.mainSection.length) {
    //     return framework.ui.mainSection[framework.ui.mainSection.length - 1];
    //   }
    // });

    // const toolbarLeft = computed(() => {
    //   return framework.ui.toolbar.filter((item) => item.position === 'left').sort(sortOrdered);
    // });

    // const toolbarRight = computed(() => {
    //   return framework.ui.toolbar.filter((item) => item.position === 'right').sort(sortOrdered).reverse();
    // });

    // const lineStyle = computed(() => {
    //   return `border-left: 1px solid ${framework.theme['text-default']}`;
    // });

    // const statusBarRight = computed(() => {
    //   return framework.ui.statusBar.filter((item) => item.position === 'right').sort(sortOrdered).reverse();
    // });

    // const statusBarLeft = computed(() => {
    //   return framework.ui.statusBar.filter((item) => item.position === 'left').sort(sortOrdered);
    // });

    // function online() {
    //   framework.notify.info('Connection has been restored');
    // }

    // function offline() {
    //   framework.notify.warning('You are disconnected', {
    //     detail: 'Features may not work as expected.',
    //   });
    // }

    // function openSettings() {
    //   settings.value = true;
    // }

    // // This is called before refresh / close
    // // I don't remove this listner because the window is closing anyway
    // window.addEventListener('beforeunload', (e) => {
    //   // if not hasUnsavedChanged then default to yes because we don't want to prompt them
    //   const choice = !hasUnsavedChanged ? 0 : remote.dialog.showMessageBoxSync(
    //     remote.getCurrentWindow(),
    //     {
    //       type: 'question',
    //       buttons: ['Yes', 'No'],
    //       title: 'Confirm',
    //       message: 'Are you sure you want to quit? Your unsaved changes will be lost.',
    //       icon: path.join(__static, 'icon.png'),
    //     },
    //   );

    //   // 0 -> Yes
    //   // 1 -> No
    //   if (choice === 0) {
    //     framework.manager.dispose();
    //   } else {
    //     // This is dumb but it's how you prevent a reload/exit (in Chrome)
    //     // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
    //     e.returnValue = '';
    //   }
    // });

    // // FIXME
    // // automation.$on('automate', this.addAutomationClip);
    // setTimeout(async () => {
    //   // Log this for debugging purposes
    //   (window as any).framework = framework;
    //   logger.info('Startup sequence complete...');
    //   loaded.value = true;
    // }, 1250);

    // onMounted(() => {
    //   window.addEventListener('offline', offline);
    //   window.addEventListener('online', online);
    //   // The offline event is not fired if initially disconnected
    //   if (!navigator.onLine) {
    //     offline();
    //   }
    // });

    // onUnmounted(() => {
    //   window.removeEventListener('offline', offline);
    //   window.removeEventListener('online', online);
    // });

    // let hasUnsavedChanged = false;
    // subscriptions.push(oly.onDidStateChange((value) => {
    //   logger.debug(
    //     'Reference or top of history changed! Are there unsaved changes -> ' +
    //     hasUnsavedChanged,
    //   );

    //   hasUnsavedChanged = value === 'unsaved';
    // }));

    // // Prevent spacebar scrolling which isn't good for the sequencers
    // window.addEventListener('keydown', (e) => {
    //   if (e.keyCode === Keys.Space && e.target === document.body) {
    //     e.preventDefault();
    //   }
    // });

    // // window.onbeforeunload = () => '';

    // // public async addAutomationClip<T extends Automatable>(automatable: T, key: keyof T & string) {
    // // FIXME Fix automation clips
    // // const added = await ddd.project.createAutomationClip({
    // //   automatable,
    // //   key,
    // //   start: this.masterStart,
    // //   end: this.masterEnd,
    // // });
    // // if (!added) {
    // //   framework.notify.warning('Unable to create automation clip', {
    // //     detail: 'There are no free tracks. Move elements and try again.',
    // //   });
    // // }
    // // }
    // return {
    //   settings,
    //   loaded,
    //   sideBarSize: framework.ui.sideBarSize,
    //   panelsSize: framework.ui.panelsSize,
    //   sideBarCollapsed: framework.ui.sideBarCollapsed,
    //   panelsCollapsed: framework.ui.panelsCollapsed,
    //   mainComponent,
    //   toolbarLeft,
    //   toolbarRight,
    //   lineStyle,
    //   statusBarRight,
    //   statusBarLeft,
    //   openSettings,
    //   framework,
    //   // IDK why but this is the only was for this array to be reactive
    //   // Sometimes I feel like I don't understand vue reactivity
    //   rootClasses: framework.ui.rootClasses,
    // };

    // const synth = Audio.createSynth({
    //   oscillator: {
    //     type: 'sawtooth',
    //   },
    //   envelope: {
    //     sustain: 0.3,
    //     attack: 0.5,
    //     decay: 0.3,
    //   },
    // });

    // synth.connect(Audio.destination);

    // // TEST
    const playing = ref(false);
    const volumeControl = ref(0);
    // watch(volumeControl, () => {
    //   // constantNode.offset.value = volumeControl.value;
    // }, { lazy: true });

    // const envelope = Audio.createEnvelope();
    // const constantNode = envelope.sig;
    // const gainNode1 = envelope;
    // gainNode1.gain.value = 0.5;
    // volumeControl.value = 0.5;
    // constantNode.connect(gainNode1.gain);
    // gainNode1.connect(Audio.destination);


    // const oscNode1 = Audio.createOscillator();
    // oscNode1.frequency.offset.value = 261.625565300598634; // middle C
    // oscNode1.connect(gainNode1);

    let disposers: Stopper[] = [];
    function startOscillators() {
      // disposers.push(oscNode1.start());

      playing.value = true;
    }

    function stopOscillators() {
      disposers.forEach((disposer) => disposer.stop());
      disposers = [];
      playing.value = false;
    }

    return {
      volumeControl,
      playing,
      text: computed(() => playing.value ? '⏸' : '▶️'),
      play: () => {
        if (!playing.value) {
          startOscillators();
        } else {
          stopOscillators();
        }
      },
      start: () => {
        // synth.triggerAttackRelease('C5', 2);

        const context = getContext();
        const source = context.createConstantSource();
        source.connect(context.destination);
        source.start(0);
        const param = Audio.createParam(source.offset, { value: 0.1 });
        param.setValueAtTime(0, 0);
        param.setValueAtTime(1, 0.1);
        // param.linearRampToValueAtTime(3, 0.2);
        // param.exponentialRampToValueAtTime(0.01, 0.3);
        // param.setTargetAtTime(-1, 0.35, 0.2);
        // param.cancelAndHoldAtTime(0.6);
        // param.linearRampTo(1.1, 0.2, 0.7); // changed from rampTo
        // param.exponentialRampTo(0, 0.1, 0.85);
        param.setValueAtTime(0, 1);
        // expect(param.getValueAtTime(0.95)).to.closeTo(0, 0.001);
        // expect(param.getValueAtTime(1)).to.eq(0);
        param.linearRampTo(1, 0.2, 1);

        const value = param.getValueAtTime(1103 / context.sampleRate);

        // envelope.triggerAttackRelease(3, Audio.context.now());
        // oscillator.start(Audio.context.currentTime);
        // oscillator.stop(Audio.context.currentTime + 2);
      },
    };
  },
});
</script>
