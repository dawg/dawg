import Vue, { VueConstructor } from 'vue';
import * as t from 'io-ts';
import PianoRollSequencer from '@/dawg/extensions/core/piano-roll/PianoRollSequencer.vue';
import Note from '@/dawg/extensions/core/piano-roll/Note.vue';
import { instruments } from '@/dawg/extensions/core/instruments';
import { patterns } from '@/dawg/extensions/core/patterns';
import { ui, TabAction } from '@/dawg/ui';
import { manager } from '@/dawg/extensions/manager';
import { positionable, selectable } from '@/modules/sequencer/helpers';
import { resizable } from '@/modules/sequencer/seq';
import { commands } from '@/dawg/extensions/core/commands';
import { panels } from '@/dawg/extensions/core/panels';
import { applicationContext } from '../application-context';
import { value, computed } from 'vue-function-api';
import { project } from '../project';

// TODO(jacob) WHy do I need to do this?
const createElement = (o: VueConstructor) => {
  return positionable(resizable(selectable(o)));
};

export const pianoRoll = manager.activate({
  id:  'dawg.piano-roll',
  workspace: {
    pianoRollRowHeight: t.number,
    pianoRollBeatWidth: t.number,
  },
  workspaceDefaults: {
    pianoRollRowHeight: 16,
    pianoRollBeatWidth: 80,
  },
  activate(context) {
    context.subscriptions.push(commands.registerCommand({
      text: 'Open Piano Roll',
      shortcut: ['CmdOrCtrl', 'P'],
      callback: () => {
        panels.openedPanel.value = 'Piano Roll';
      },
    }));

    const pianoRollRowHeight = context.workspace.pianoRollRowHeight;
    const pianoRollBeatWidth = context.workspace.pianoRollBeatWidth;

    Vue.component('Note', createElement(Note));

    const recording = value(false);
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
        project: project.project,
        selectedScore: instruments.selectedScore,
        selectedPattern: patterns.selectedPattern,
        recording,
        pianoRollBeatWidth,
        pianoRollRowHeight,
      }),
      computed: {
        pianoRollPlay() {
          return project.play && applicationContext.context.value === 'pianoroll';
        },
      },
    });

    const actions: TabAction[] = [];

    ui.panels.push({
      name: 'Piano Roll',
      component,
      actions,
    });

    return {
      addAction(action: TabAction) {
        actions.push(action);
      },
      setRecording(r: boolean) {
        recording.value = r;
      },
    };
  },
});
