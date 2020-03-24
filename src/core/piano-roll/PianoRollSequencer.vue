<template>
  <drop
    group="midi"
    @drop="addNotes"
  >
    <sequencer
      style="height: 100%"
      v-on="$listeners"
      v-bind="$attrs"
      :beats-per-measure="beatsPerMeasure"
      :row-height="rowHeight"
      :sequence="score.notes"
      :transport="pattern.transport"
      :num-rows="allKeys.length"
      :prototype.sync="note"
      :side-width="90"
      :row-class="rowClass"
      name="Piano Roll"
    >
      <template slot="side">
        <piano 
          :synth="score.instrument"
          :key-height="rowHeight"
        ></piano>
      </template>
    </sequencer>
  </drop>
</template>

<script lang="ts">
import { allKeys, keyLookup } from '@/utils';
import {
  ScheduledNote,
  Instrument,
  Playlist,
  Pattern,
  Score,
  createNotePrototype,
  ScheduledElement,
} from '@/models';
import { SchedulablePrototype } from '@/models';
import { createComponent, computed, watch, ref, reactive } from '@vue/composition-api';
import * as Audio from '@/lib/audio';

export default createComponent({
  name: 'PianoRollSequencer',
  props: {
    beatsPerMeasure: { type: Number, required: true },
    score: { type: Object as () => Score, required: true },
    pattern: { type: Object as () => Pattern, required: true },
    rowHeight: { type: Number, required: true },
  },
  setup(props, context) {
    // This is the prototype
    // row and time are overwritten so they can be set to 0 here
    const note = ref<SchedulablePrototype<any, any, any>>();

    function rowClass(i: number) {
      const key = allKeys[i].value;
      return key.includes('#') ? 'bg-default-darken-1' : 'bg-default';
    }

    function addNotes(notes: Audio.INotes) {
      notes.forEach((iNote) => {
        // Transform the interfaces into actual note classes
        const row = keyLookup[iNote.name].id;
        const n = createNotePrototype({
          row,
          duration: iNote.duration,
          time: iNote.start,
        }, props.score.instrument, { velocity: iNote.velocity })(props.pattern.transport).copy();

        props.score.notes.push(n);
      });
    }

    watch(() => props.score, () => {
      const create = createNotePrototype({ row: 0, time: 0, duration: 1 }, props.score.instrument, { velocity: 1 });
      note.value = create(props.pattern.transport).copy;
    });

    return {
      addNotes,
      allKeys,
      rowClass,
      note,
    };
  },
});
</script>
