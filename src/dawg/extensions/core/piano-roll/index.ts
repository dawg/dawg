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
import { commands } from '@/dawg/extensions/core/commands';
import { panels } from '@/dawg/extensions/core/panels';
import { applicationContext } from '../application-context';
import { value, computed } from 'vue-function-api';

// TODO(jacob) WHy do I need to do this?
const createElement = (o: VueConstructor) => {
  return positionable(resizable(selectable(o)));
};

// tslint:disable-next-line:interface-over-type-literal
type Workspace = {
  pianoRollRowHeight: number;
  pianoRollBeatWidth: number;
};

export const pianoRoll = manager.activate<Workspace, {}, {}, { addAction: (action: TabAction) => void }>({
  id:  'dawg.piano-roll',
  activate(context) {
    context.subscriptions.push(commands.registerCommand({
      text: 'Open Piano Roll',
      shortcut: ['CmdOrCtrl', 'P'],
      callback: () => {
        panels.openedPanel.value = 'Piano Roll';
      },
    }));

    const pianoRollRowHeight = computed(() => {
      return context.workspace.get('pianoRollRowHeight', 16);
    }, (height: number) => {
      context.workspace.set('pianoRollRowHeight', height);
    });

    const pianoRollBeatWidth = computed(() => {
      return context.workspace.get('pianoRollBeatWidth', 80);
    }, (height: number) => {
      context.workspace.set('pianoRollBeatWidth', height);
    });

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
        :row-height.sync="pianoRollRowHeight.value"
        :px-per-beat.sync="pianoRollBeatWidth.value"
        :is-recording="general.isRecording"
      ></piano-roll-sequencer>
      `,
      data: () => ({
        selectedScore: instruments.selectedScore,
        selectedPattern: patterns.selectedPattern,
        general,
        workspace,
        pianoRollBeatWidth,
        pianoRollRowHeight,
      }),
      computed: {
        pianoRollPlay() {
          return general.play && applicationContext.context.value === 'pianoroll';
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
