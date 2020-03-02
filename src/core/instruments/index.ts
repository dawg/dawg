import Vue from 'vue';
import Synths from '@/core/instruments/Synths.vue';
import * as framework from '@/lib/framework';
import { ref, Ref, computed, watch } from '@vue/composition-api';
import { patterns } from '@/core/patterns';
import { Score, Soundfont, Synth } from '@/models';
import { project } from '@/core/project';
import { findUniqueName } from '@/utils';

export const instruments = framework.manager.activate({
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
          instruments: project.instruments,
          selectedPattern: patterns.selectedPattern,
        };
      },
    });

    function addInstrument(event: MouseEvent) {
      const doAdd = async (type: 'Synth' | 'Soundfont') => {
        const name = findUniqueName(project.instruments, type);
        const instrument = type === 'Soundfont' ?
          await Soundfont.create('acoustic_grand_piano', name) :
          Synth.create(name);

        project.instruments.push(instrument);
      };

      framework.menu({
        position: event,
        items: [
          {
            text: 'Synth',
            callback: () => doAdd('Synth'),
          },
          {
            text: 'Soundfont',
            callback: () => doAdd('Soundfont'),
          },
        ],
        left: true,
      });
    }

    framework.ui.panels.push({
      name: 'Instruments',
      component,
      actions: [{
        icon: ref('add'),
        tooltip: ref('Add Instrument'),
        callback: addInstrument,
      }],
    });

    const selectedScoreId: Ref<string | null> = ref(null);

    const scoreLookup = computed(() => {
      if (!patterns.selectedPattern.value) { return null; }
      const scores: {[k: string]: Score} = {};

      patterns.selectedPattern.value.scores.forEach((score) => {
        scores[score.id] = score;
      });

      return scores;
    });

    const selectedScore = computed({
      get: () => {
        if (!selectedScoreId.value) { return null; }
        if (!scoreLookup.value) { return null; }
        if (!scoreLookup.value.hasOwnProperty(selectedScoreId.value)) { return null; }
        return scoreLookup.value[selectedScoreId.value];
      },
      set: (score) => {
        if (score) {
          selectedScoreId.value = score.id;
        } else {
          selectedScoreId.value = null;
        }
      },
    });

    watch(patterns.selectedPattern, () => {
      if (!selectedScoreId.value || !scoreLookup.value) {
        return;
      }

      if (selectedScoreId.value in scoreLookup.value) {
        return;
      }

      // Invalidate the selected score
      selectedScoreId.value = null;
    });

    return {
      selectedScore,
    };
  },
});
