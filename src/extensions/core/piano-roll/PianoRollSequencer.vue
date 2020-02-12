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
      :transport="transport"
      :num-rows="allKeys.length"
      :prototype.sync="note"
      :row-class="rowClass"
      :set-loop-end="setLoopEnd"
      :colored="false"
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
import { allKeys, keyLookup } from '@/utils';
import { INotes } from '@/lib/midi-parser';
import { Note, Instrument, Playlist, Pattern, Score, Sequence } from '@/core';
import { Watch } from '@/lib/update';

@Component
export default class PianoRollSequencer extends Vue {
  @Prop({ type: Number, required: true }) public beatsPerMeasure!: number;
  @Prop({ type: Object, required: true }) public score!: Score;
  @Prop({ type: Object, required: true }) public pattern!: Pattern;
  @Prop({ type: Number, required: true }) public rowHeight!: number;

  public lastNote: null | Note = null;
  public eventDisposer?: { dispose: () => void };

  // This is the prototype
  // row and time are overwritten so they can be set to 0 here
  public allKeys = allKeys;
  public note: Note | null = null;

  get instrument() {
    return this.score.instrument;
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
    return key.includes('#') ? 'bg-default-darken-1' : 'bg-default';
  }

  public addNotes(notes: INotes) {
    notes.forEach((iNote) => {
      // Transform the interfaces into actual note classes
      const row = keyLookup[iNote.name].id;
      const note = new Note(this.instrument, {
        row,
        duration: iNote.duration,
        time: iNote.start,
        velocity: iNote.velocity,
      });

      this.score.notes.add(note);
    });
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

  @Watch<PianoRollSequencer>('instrument', { immediate: true })
  public setPrototype() {
    this.note = new Note(this.instrument, { row: 0, time: 0, duration: 1 });
  }

  @Watch<PianoRollSequencer>('score', { immediate: true })
  public addListener() {
    if (this.eventDisposer) {
      this.eventDisposer.dispose();
    }

    const addedDisposer = this.score.notes.on('added', (el) => {
      if (el.endBeat > this.playlistLoopEnd) {
        this.lastNote = el;
      }
    });

    const removedDisposer = this.score.notes.on('removed', (el) => {
      if (el === this.lastNote) {
        this.checkAll();
      }
    });

    this.eventDisposer = {
      dispose: () => {
        addedDisposer.dispose();
        removedDisposer.dispose();
      },
    };
  }
}
</script>
