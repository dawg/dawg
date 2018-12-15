<template>
  <div class="sequencer">
    <!-- 
      We need this child element for scroll reasons.
      See https://stackoverflow.com/questions/16670931/hide-scroll-bar-but-while-still-being-able-to-scroll
     -->
    <div class="sequencer-child" @scroll="scroll" ref="scroller">
      <div class="select-area" :style="selectStyle"></div>
      <div 
        class="layer rows" 
        ref="rows" 
        :style="`height: ${allKeys.length * noteHeight}px`"
      >
        <sequencer-row
          v-for="key in allKeys" 
          :key="key.id"
          :id="key.id"
          :total-beats="displayBeats"
          @click="add"
          @mousedown="selectStart"
        ></sequencer-row>
      </div>
      <div :style="sequencerStyle" class="layer lines" ref="beatLines"></div>
      <note
        v-for="(note, i) in notes"
        :key="i"
        :start="note.time"
        :id="note.id"
        :selected="note.selected"
        style="position: absolute; z-index: 2"
        @contextmenu="remove($event, i)"
        @mousedown="clickNote($event, i)"
        @input="changeDefault"
        v-model="note.length"
      ></note>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Inject } from 'vue-property-decorator';
import { Draggable, PX } from '@/mixins';
import { Keys } from '@/keys';
import { FactoryDictionary } from 'typescript-collections';
import { allKeys, range, copy } from '@/utils';
import NoteComponent from '@/components/Note.vue';
import { Note } from '@/types';
import BeatLines from '@/components/BeatLines';
import SequencerRow from '@/components/SequencerRow.vue';

interface EnhancedNote extends Note {
  selected: boolean;
}

// TODO Create Note class

@Component({
  components: { Note: NoteComponent, SequencerRow },
})
export default class Sequencer extends Mixins(Draggable, PX, BeatLines) {
  @Inject() public noteHeight!: number;
  @Inject() public stepsPerBeat!: number;
  @Prop(Array) public value?: Note[];  // TODO Change value to something else (initial maybe?)
  @Prop({ type: Number, default: 1 }) public defaultLength!: number;
  @Prop({ type: Number, default: 0.25 }) public snap!: number; // TODO snap is hardcoded


  public notes: EnhancedNote[] = [];
  public cursor = 'move';
  public default = this.defaultLength;  // To avoid mutating a prop
  public rows!: HTMLElement;
  public selectStartEvent: MouseEvent | null = null;
  public selectCurrentEvent: MouseEvent | null = null;
  public holdingShift = false;
  public allKeys = allKeys;
  public minDisplayMeasures = 4;
  public loopEnd: number | null = null;

  public scroll(e: UIEvent) {
    // This only handles horizontal scrolls!
    const scroller = this.$refs.scroller as HTMLElement;
    this.$emit('scroll-horizontal', scroller.scrollLeft);
  }
  get sequencerStyle() {
    return {
      // TODO This may not be needed
      width: `${this.displayBeats * this.pxPerBeat}px`,
      height: `${this.allKeys.length * this.noteHeight}px`,
    };
  }
  get displayBeats() {
    return Math.max(
      this.minDisplayMeasures * this.beatsPerMeasure,
      this.loopEnd,
    ) * this.stepsPerBeat;
  }
  public get selectStyle() {
    if (!this.selectStartEvent) { return; }
    if (!this.selectCurrentEvent) {
      this.notes.forEach((note) => note.selected = false);
      return;
    }

    const boundingRect = this.rows.getBoundingClientRect();

    const left = Math.min(
      this.selectStartEvent.clientX - boundingRect.left,
      this.selectCurrentEvent.clientX - boundingRect.left,
    );
    const top = Math.min(
      this.selectStartEvent.clientY - boundingRect.top,
      this.selectCurrentEvent.clientY - boundingRect.top,
    );

    const width = Math.abs(this.selectCurrentEvent.clientX - this.selectStartEvent.clientX);
    const height = Math.abs(this.selectCurrentEvent.clientY - this.selectStartEvent.clientY);

    // these are exact numbers BTW, not integers
    const minBeat = left / this.pxPerBeat;
    const minRow = top / this.noteHeight;
    const maxBeat = (left + width) / this.pxPerBeat;
    const maxRow = (top + height) / this.noteHeight;

    this.notes.forEach((note) => {
      // Check if there is any overlap between the rectangles
      // https://www.geeksforgeeks.org/find-two-rectangles-overlap/
      if (minRow > note.id + 1 || note.id > maxRow) {
        note.selected = false;
      } else if (minBeat > note.time + note.length || note.time > maxBeat) {
        note.selected = false;
      } else {
        note.selected = true;
      }
    });

    return {
      position: 'absolute',
      borderRadius: '5px',
      border: 'solid 1px red',
      backgroundColor: 'rgba(255, 51, 51, 0.3)',
      left: `${left}px`,
      top: `${top}px`,
      height: `${height}px`,
      width: `${width}px`,
      zIndex: 3,
    };
  }
  public selectStart(e: MouseEvent) {
    this.selectStartEvent = e;
    window.addEventListener('mousemove', this.selectMove);
    window.addEventListener('mouseup', this.selectEnd);
  }
  public selectMove(e: MouseEvent) {
    this.selectCurrentEvent = e;
  }
  public selectEnd() {
    this.selectStartEvent = null;
    this.selectCurrentEvent = null;
    window.removeEventListener('mousemove', this.selectMove);
    window.removeEventListener('mouseup', this.selectEnd);
  }

  public add(id: number, e: MouseEvent) {
    const left = this.$el.getBoundingClientRect().left;
    const x = e.clientX - left;
    let time = x / this.pxPerBeat;
    time = Math.floor(time / this.snap) * this.snap;
    this.$log.debug(x, e.clientX, left, time);

    const note = {
      length: this.default,
      selected: false,
      id,
      time,
    };

    this.notes.push(note);
    this.$emit('added', note);
    this.checkLoopEnd();
  }
  public move(e: MouseEvent, i: number) {
    const rect = this.rows.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let time = x / this.pxPerBeat;
    time = Math.floor(time / this.snap) * this.snap;

    const y = e.clientY - rect.top;
    const row = Math.floor(y / this.noteHeight);

    const oldNote = this.notes[i];
    if (row === oldNote.id && time === oldNote.time) { return; }

    const timeDiff = time - oldNote.time;
    const rowDiff = row - oldNote.id;

    let notesToMove: Array<[EnhancedNote, number]>;
    if (oldNote.selected) {
      notesToMove = this.notes.map((note, ind) => {
        return [note, ind] as [EnhancedNote, number];
      }).filter(([note, _]) => note.selected);
    } else {
      notesToMove = [[oldNote, i]];
    }

    notesToMove.forEach(([note, i]) => {
      const newTime = note.time + timeDiff;
      const newNote = {
        length: note.length,
        selected: note.selected,
        time: newTime,
        id: note.id + rowDiff,
      };

      this.$set(this.notes, i, newNote);
      this.$emit('removed', note);
      this.$emit('added', newNote);
      this.checkLoopEnd();
    });
  }
  public remove(e: MouseEvent, i: number) {
    e.preventDefault();
    this.removeAtIndex(i);
  }
  public removeAtIndex(i: number) {
    const item = this.notes[i];
    this.$delete(this.notes, i);
    this.$emit('removed', item);
    this.checkLoopEnd();
  }
  public checkLoopEnd() {
    const maxTime = Math.max(...this.notes.map((note) => note.time), this.beatsPerMeasure);
    const loopEnd = Math.ceil(maxTime / this.beatsPerMeasure) * this.beatsPerMeasure;
    this.$log.debug(`loopEnd -> ${loopEnd}`);
    if (loopEnd !== this.loopEnd) {
      this.$emit('loop-end', loopEnd);
      this.loopEnd = loopEnd;
    }
  }
  public changeDefault(length: number) {
    this.default = length;
  }
  public clickNote(e: MouseEvent, i: number) {
    const note = this.notes[i];
    if (!note.selected) { this.notes.forEach((n) => n.selected = false); }

    const createNote = (oldNote: EnhancedNote) => {
      const newNote = copy(oldNote);

      // We do this because `newNew` will have a heigher z-index
      // Thus, it will be displayed on top (which we want)
      oldNote.selected = false;

      this.notes.push(newNote);
      this.$emit('added', newNote);
    };

    let targetIndex = i;
    if (this.holdingShift) {
      let selected: EnhancedNote[];

      // If selected, copy all selected. If not, just copy the note that was clicked.
      if (note.selected) {
        selected = this.notes.filter((n) => n.selected && n !== note);
        targetIndex = this.notes.length; // A copy of `note` will be created at this index
        createNote(note);
      } else {
        selected = [note];
      }

      selected.forEach(createNote);
    }
    this.addListeners(e, targetIndex);
  }
  public keydown(e: KeyboardEvent) {
    if (e.keyCode === Keys.SHIFT) {
      this.holdingShift = true;
    } else if (e.keyCode === Keys.DELETE || e.keyCode === Keys.BACKSPACE) {
      // Slice and reverse since we will be deleting from the array as we go
      const lastIndex = this.notes.length - 1;
      this.notes.slice().reverse().forEach((note, i) => {
        if (note.selected) {
          this.removeAtIndex(lastIndex - i);
        }
      });
    }
  }
  public keyup(e: KeyboardEvent) {
    if (e.keyCode === Keys.SHIFT) { this.holdingShift = false; }
  }

  public mounted() {
    this.rows = this.$refs.rows as HTMLElement;
    // Make a shallow copy so we don't alter the prop
    const notes = this.value ? this.value.slice() : [];
    this.notes = notes.map((note) => {
      return {
        ...note,
        selected: false,
      };
    });

    this.notes.map((note) => {
      this.$emit('added', note);
    });
    this.checkLoopEnd();

    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);
  }

  public destroyed() {
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
  }
}
</script>

<style scoped lang="sass">
.sequencer
  width: 100%
  background: #303030
  display: inline-block
  position: relative

.note
  border-bottom: solid 0.5px #000

.measure, .section
  display: flex

.rows
  display: flex
  flex-direction: column
  position: absolute

.lines
  height: 100%
  z-index: 1 
  position: relative
  pointer-events: none

.notes
  position: absolute
  top: 0

.sequencer-child
  position: relative
  overflow-x: scroll
</style>
