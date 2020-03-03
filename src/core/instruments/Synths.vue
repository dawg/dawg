<template>
  <div class="synths">
    <synth
      v-for="(instrument, i) in instruments"
      :key="i"
      @delete="deleteInstrument(i)"
      @open="openScore(i)"
      :instrument="instrument"
      :notes="getNotes(instrument)"
      :channel.sync="instrument.channel.value"
    ></synth>
  </div>
</template>

<script lang="ts">
import Synth from '@/components/Synth.vue';
import { update } from '@/lib/vutils';
import { Score, Instrument, Pattern } from '@/models';
import { notify } from '@/core/notify';
import { project } from '@/core/project';
import { createComponent, computed, watch } from '@vue/composition-api';

export default createComponent({
  components: { Synth },
  name: 'Synths',
  props: {
    instruments: { type: Array as () => Array<Instrument<any, any>>, required: true },
    selectedScore: { type: Object as () => Score },
    selectedPattern: { type: Object as () => Pattern },
  },
  setup(props, context) {
    const scoreLookup = computed(() => {
      const lookup: {[k: string]: Score} = {};
      if (props.selectedPattern) {
        props.selectedPattern.scores.forEach((score) => {
          lookup[score.instrumentId] = score;
        });
      }
      return lookup;
    });

    function getNotes(instrument: Instrument<any, any>) {
      if (instrument.id in scoreLookup.value) {
        return scoreLookup.value[instrument.id].notes.slice();
      }
    }

    function openScore(i: number) {
      if (!props.selectedPattern) {
        notify.warning('Please select a Pattern first.', {
          detail: 'You must select a pattern before you can open the Piano Roll',
        });
        return;
      }

      const instrument = props.instruments[i];
      if (!scoreLookup.value.hasOwnProperty(instrument.id)) {
        const newScore = Score.create(props.selectedPattern.transport, instrument);
        props.selectedPattern.scores.push(newScore);
      }

      update(props, context, 'selectedScore', scoreLookup.value[instrument.id]);
    }

    function deleteInstrument(i: number) {
      project.instruments.splice(i, 1);
    }

    watch(() => props.selectedPattern, () => {
      if (props.selectedPattern) {
        update(props, context, 'selectedScore', props.selectedPattern.scores[0] || undefined);
      } else {
        update(props, context, 'selectedScore', undefined);
      }
    });

    return {
      deleteInstrument,
      openScore,
      getNotes,
      project,
    };
  },
});
</script>
