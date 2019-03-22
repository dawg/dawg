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
      :elements="notes"
      :transport="transport"
      :num-rows="allKeys.length"
      :prototype.sync="note"
      :row-class="rowClass"
      :set-loop-end="setLoopEnd"
      name="Piano Roll"
      @added="added"
      @removed="removed"
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
import { INotes } from '@/midi-parser';
import Transport from '@/modules/audio/transport';
import { Note, Instrument, Element, Playlist, Pattern, Score } from '@/schemas';
import { Watch } from '@/modules/update';

@Component({
  components: { Sequencer },
})
export default class PianoRollSequencer extends Vue {
  @Prop({ type: Number, required: true }) public beatsPerMeasure!: number;
  @Prop({ type: Object, required: true }) public score!: Score;
  @Prop({ type: Object, required: true }) public pattern!: Pattern;
  @Prop({ type: Number, required: true }) public rowHeight!: number;

  public lastNote: null | Note = null;

  // This is the prototype
  // row and time are overwritten so they can be set to 0 here
  public note = new Note({ row: 0, time: 0, duration: 1 }).init(this.instrument);
  public allKeys = allKeys;

  get instrument() {
    return this.score.instrument;
  }

  get notes() {
    return this.score.notes;
  }

  get transport() {
    return this.pattern.transport;
  }

  get setLoopEnd() {
    // Always round up to the nearest measure
    return Math.ceil(this.playlistLoopEnd / this.beatsPerMeasure) * this.beatsPerMeasure;
  }

  get playlistLoopEnd() {
    if (!this.lastNote) {
      return 0;
    }

    return this.lastNote.endBeat;
  }

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

      // TODO Refactor this
      this.notes.push(note);
      note.schedule(this.transport);
    });
  }

  public added(el: Note) {
    if (el.endBeat > this.playlistLoopEnd) {
      this.lastNote = el;
    }
  }

  public removed(el: Note) {
    if (el === this.lastNote) {
      this.checkAll();
    }
  }

  public checkAll() {
    let max: null | Note = null;
    this.pattern.scores.forEach((score) => {
      score.notes.forEach((note) => {
        if (!max || note.time + note.duration > max.time + max.duration) {
          max = note;
        }
      });
    });

    this.lastNote = max;
  }

  @Watch<PianoRollSequencer>('pattern')
  public checkPattern() {
    this.checkAll();
  }
}
</script>

<style lang="sass" scoped>

</style>