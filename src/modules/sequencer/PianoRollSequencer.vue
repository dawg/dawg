<template>
  <drop
    group="midi"
    @drop="addNotes"
  >
    <sequencer
      style="height: 100%"
      v-on="$listeners"
      v-bind="$attrs"
      :row-height="rowHeight"
      :num-rows="allKeys.length"
      :prototype.sync="note"
      :transport="transport"
      :elements="elements"
      :row-class="rowClass"
      name="Piano Roll"
    >
      <template slot="side">
        <piano 
          :synth="instrument"
          :key-height="rowHeight"
        ></piano>
      </template>
    </sequencer>
  </drop>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import Sequencer from '@/modules/sequencer/Sequencer.vue';
import { allKeys, toTickTime, keyLookup } from '@/utils';
import { Note, Instrument, Element } from '@/schemas';
import { INotes } from '@/midi-parser';
import Transport from '@/modules/audio/transport';

@Component({
  components: { Sequencer },
})
export default class PianoRollSequencer extends Vue {
  @Prop({ type: Object, required: true }) public transport!: Transport;
  @Prop({ type: Array, required: true }) public elements!: Element[];
  @Prop({ type: Object, required: true }) public instrument!: Instrument;
  @Prop({ type: Number, required: true }) public rowHeight!: number;

  public note = new Note({ row: -1, time: -1, duration: 1 }).init(this.instrument);
  public allKeys = allKeys;

  public rowClass(i: number) {
    const key = allKeys[i].value;
    return key.includes('#') ? 'secondary-darken-1' : 'secondary';
  }

  public addNotes(notes: INotes) {
    notes.forEach((iNote) => {
      // Transform the interfaces into actual note classes
      const row = keyLookup[iNote.name].id;
      const note = new Note({
        row,
        duration: iNote.duration,
        time: iNote.start,
      }).init(this.instrument);

      this.elements.push(note);
      note.schedule(this.transport);
    });
  }
}
</script>

<style lang="sass" scoped>

</style>