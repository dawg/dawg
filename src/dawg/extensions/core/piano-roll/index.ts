import Vue, { VueConstructor } from 'vue';
import PianoRollSequencer from '@/dawg/extensions/core/piano-roll/PianoRollSequencer.vue';
import Note from '@/dawg/extensions/core/piano-roll/Note.vue';
import { workspace, general } from '@/store';
import { instruments } from '@/dawg/extensions/core/instruments';
import { patterns } from '@/dawg/extensions/core/patterns';
import { ui, TabAction } from '@/dawg/ui';
import { manager } from '@/dawg/extensions/manager';
import { positionable, selectable } from '@/modules/sequencer/helpers';
import { resizable } from '@/modules/sequencer/seq';
import { commands } from '../commands';
import { panels } from '../panels';

// TODO(jacob) WHy do I need to do this?
const createElement = (o: VueConstructor) => {
  return positionable(resizable(selectable(o)));
};

export const pianoRoll = manager.activate({
  id:  'dawg.piano-roll',
  activate(context) {
    context.subscriptions.push(commands.registerCommand({
      text: 'Open Piano Roll',
      shortcut: ['CmdOrCtrl', 'P'],
      callback: () => {
        panels.openedPanel.value = 'Piano Roll';
      },
    }));

    Vue.component('Note', createElement(Note));

    const component = Vue.extend({
      components: { PianoRollSequencer },
      template: `
      <piano-roll-sequencer
        style="height: 100%"
        v-if="selectedScore.value"
        :pattern="selectedPattern"
        :score="selectedScore.value"
        :play="pianoRollPlay"
        :steps-per-beat="general.project.stepsPerBeat"
        :beats-per-measure="general.project.beatsPerMeasure"
        :row-height="workspace.pianoRollRowHeight"
        :px-per-beat="workspace.pianoRollBeatWidth"
        :is-recording="general.isRecording"
        @update:rowHeight="workspace.setPianoRollRowHeight"
        @update:pxPerBeat="workspace.setPianoRollBeatWidth"
      ></piano-roll-sequencer>
      `,
      data: () => ({
        selectedScore: instruments.selectedScore,
        selectedPattern: patterns.selectedPattern,
        general,
        workspace,
      }),
      computed: {
        pianoRollPlay() {
          return general.play && workspace.applicationContext === 'pianoroll';
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
    };
  },
});
