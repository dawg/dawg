import Vue from 'vue';
import { createExtension } from '@/dawg/extensions';
import PianoRollSequencer from '@/dawg/extensions/core/piano-roll/PianoRollSequencer.vue';
import Note from '@/dawg/extensions/core/piano-roll/Note.vue';
import { workspace, general } from '@/store';
import { instruments } from '@/dawg/extensions/core/instruments';
import { patterns } from '@/dawg/extensions/core/patterns';
import { ui } from '@/dawg/ui';
import { createElement } from '@/modules/sequencer';

export const extension = createExtension({
  id:  'dawg.project',
  activate() {
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


    ui.panels.push({
      name: 'Piano Roll',
      component,
    });
  },
});
