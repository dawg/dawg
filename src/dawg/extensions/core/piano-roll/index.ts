import Vue from 'vue';
import * as t from '@/modules/io';
import PianoRollSequencer from '@/dawg/extensions/core/piano-roll/PianoRollSequencer.vue';
import Note from '@/dawg/extensions/core/piano-roll/Note.vue';
import { instruments } from '@/dawg/extensions/core/instruments';
import { patterns } from '@/dawg/extensions/core/patterns';
import * as framework from '@/framework';
import { commands } from '@/dawg/extensions/core/commands';
import { ref, watch } from '@vue/composition-api';
import { project } from '@/dawg/extensions/core/project';
import { controls } from '@/dawg/extensions/core/controls';

export const pianoRoll = framework.manager.activate({
  id:  'dawg.piano-roll',
  workspace: {
    pianoRollRowHeight: {
      type: t.number,
      default: 16,
    },
    pianoRollBeatWidth: {
      type: t.number,
      default: 80,
    },
  },
  activate(context) {
    context.subscriptions.push(commands.registerCommand({
      text: 'Open Piano Roll',
      shortcut: ['CmdOrCtrl', 'P'],
      callback: () => {
        framework.ui.openedPanel.value = 'Piano Roll';
      },
    }));

    const pianoRollRowHeight = context.workspace.pianoRollRowHeight;
    const pianoRollBeatWidth = context.workspace.pianoRollBeatWidth;

    Vue.component('Note', Vue.extend(Note));

    const recording = ref(false);
    const component = Vue.extend({
      components: { PianoRollSequencer },
      template: `
      <piano-roll-sequencer
        style="height: 100%"
        v-if="selectedScore.value"
        :pattern="selectedPattern.value"
        :score="selectedScore.value"
        :play="pianoRollPlay"
        :steps-per-beat="project.stepsPerBeat"
        :beats-per-measure="project.beatsPerMeasure"
        :row-height.sync="pianoRollRowHeight.value"
        :px-per-beat.sync="pianoRollBeatWidth.value"
        :is-recording="recording.value"
      ></piano-roll-sequencer>
      `,
      data: () => ({
        project,
        selectedScore: instruments.selectedScore,
        selectedPattern: patterns.selectedPattern,
        recording,
        pianoRollBeatWidth,
        pianoRollRowHeight,
      }),
      computed: {
        pianoRollPlay() {
          return controls.state.value === 'started' && controls.context.value === 'pianoroll';
        },
      },
    });

    const actions: framework.TabAction[] = [];

    framework.ui.panels.push({
      name: 'Piano Roll',
      component,
      actions,
    });

    watch(instruments.selectedScore, () => {
      if (instruments.selectedScore.value) {
        framework.ui.openedPanel.value = 'Piano Roll';
      }
    });

    return {
      addAction(action: framework.TabAction) {
        actions.push(action);
      },
      setRecording(r: boolean) {
        recording.value = r;
      },
    };
  },
});
