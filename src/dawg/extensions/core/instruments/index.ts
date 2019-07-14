import Vue from 'vue';
import Synths from '@/dawg/extensions/core/instruments/Synths.vue';
import { manager } from '@/dawg/extensions/manager';
import { value, Wrapper, computed } from 'vue-function-api';
import { patterns } from '@/dawg/extensions/core/patterns';
import { Score } from '@/core';
import { ui } from '@/dawg/ui';
import { menu } from '@/dawg/extensions/core/menu';
import { project } from '../project';

export const instruments = manager.activate({
  id: 'dawg.instruments',
  activate() {
    const component = Vue.extend({
      components: { Synths },
      template: `
      <synths
        :instruments="instruments"
        :selected-score.sync="selectedScore.value"
        :selected-pattern="selectedPattern.value"
      ></synths>
      `,
      data() {
        return {
          selectedScore,
          instruments: project.project.instruments,
          selectedPattern: patterns.selectedPattern,
        };
      },
    });

    function addInstrument(event: MouseEvent) {
      menu.menu({
        event,
        items: [
          {
            text: 'Synth',
            callback: () => project.project.addInstrument('Synth'),
          },
          {
            text: 'Soundfont',
            callback: () => project.project.addInstrument('Soundfont'),
          },
        ],
        left: true,
      });
    }

    ui.panels.push({
      name: 'Instruments',
      component,
      actions: [{
        icon: value('add'),
        tooltip: value('Add Instrument'),
        callback: addInstrument,
      }],
    });

    const selectedScoreId: Wrapper<string | null> = value(null);

    const scoreLookup = computed(() => {
      if (!patterns.selectedPattern.value) { return null; }
      const scores: {[k: string]: Score} = {};

      // TODO MAKE LOOKUP
      patterns.selectedPattern.value.scores.forEach((score) => {
        scores[score.id] = score;
      });
      return scores;
    });

    const selectedScore = computed(
      () => {
        if (!selectedScoreId.value) { return null; }
        if (!scoreLookup.value) { return null; }
        if (!scoreLookup.value.hasOwnProperty(selectedScoreId.value)) { return null; }
        return scoreLookup.value[selectedScoreId.value];
      },
      (pattern) => {
        if (pattern) {
          selectedScoreId.value = pattern.id;
        } else {
          selectedScoreId.value = null;
        }
      },
    );

    return {
      selectedScore,
    };
  },
});
