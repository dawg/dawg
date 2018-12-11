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
        :style="`height: ${noteRows.length * noteHeight}px`"
      >
        <div
          v-for="(note, row) in noteRows" 
          :key="note.value"
          :style="rowStyle(row, note.color)"
          @click="add(row, $event)"
          @contextmenu="$event.preventDefault()"
          @mousedown="selectStart"
        ></div>
      </div>
      <div :style="sequencerStyle" class="layer lines" ref="beatLines"></div>
      <note
        v-for="(note, i) in notes"
        :key="i"
        :height="noteHeight"
        :width="noteWidth"
        :x="note.x"
        :y="note.y"
        :selected="note.selected"
        style="position: absolute; z-index: 2"
        @contextmenu="remove($event, note)"
        @mousedown="clickNote($event, note)"
        @input="changeDefault"
        v-model="note.length"
      ></note>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator';
import { Draggable, PX } from '@/mixins';
import { Keys } from '@/keys';
import { FactoryDictionary } from 'typescript-collections';
import { notes, range, BLACK, WHITE } from '@/utils';
import Note from '@/components/Note.vue';
import { NoteInfo } from '@/types';
import BeatLines from '@/components/BeatLines';

interface Colors {
  [key: string]: string;
}

interface BasicNoteInfo {
  value: string;
  color: string;
}

interface Point {
  x: number;
  y: number;
}

// TODO Create NoteInfo class

@Component({
  components: { Note },
})
export default class Sequencer extends Mixins(Draggable, PX, BeatLines) {
  @Prop({ type: Number, required: true }) public noteHeight!: number;
  @Prop(Array) public value?: NoteInfo[];  // TODO Change value to something else (initial maybe?)
  @Prop({ type: String, default: '#21252b' }) public blackColor!: string;
  @Prop({ type: String, default: '#282c34' }) public whiteColor!: string;
  @Prop({ type: Array, default: () => [4, 5] }) public octaves!: number[];
  @Prop({ type: Number, default: 1 }) public defaultLength!: number;
  @Prop({ type: Number, required: true }) public measures!: number;
  @Prop({ type: Number, default: 4 }) public minMeasures!: number; // TODO

  public notes: NoteInfo[] = [];
  public quarters = 4;
  public sixteenths = 4;
  public cursor = 'move';
  public default = this.defaultLength;
  public rows!: HTMLElement;
  public draggingIndex: number | null = null;
  public selectStartEvent: MouseEvent | null = null;
  public selectCurrentEvent: MouseEvent | null = null;
  public shift = false;

  public scroll(e: UIEvent) {
    // This only handles horizontal scrolls!
    const scroller = this.$refs.scroller as HTMLElement;
    this.$emit('scroll-horizontal', scroller.scrollLeft);
  }
  get sequencerStyle() {
    return {
      // TODO This may not be needed
      width: `${this.totalSixteenths * this.noteWidth}px`,
      height: `${this.noteRows.length * this.noteHeight}px`,
    };
  }
  get colorLookup(): Colors {
    return {
      [BLACK]: this.blackColor,
      [WHITE]: this.whiteColor,
    };
  }
  get totalSixteenths() {
    return this.measures * this.quarters * this.sixteenths;
  }
  get noteRows() {
    const n: BasicNoteInfo[] = [];
    this.octaves.slice().reverse().map((octave) => {
      notes.map((note) => n.push({
        color: note.color,
        value: note.value + octave,
      }));
    });
    return n.reverse();
  }
  public afterMove() {
    this.draggingIndex = null;
  }
  public get selectStyle() {
    if (!this.selectStartEvent) { return; }
    if (!this.selectCurrentEvent) {
      this.notes.forEach((note) => note.selected = false);
      return;
    }

    const boundingRect = this.rows.getBoundingClientRect();

    const left = this.selectStartEvent.clientX - boundingRect.left;
    const top = this.selectStartEvent.clientY - boundingRect.top;

    const width = this.selectCurrentEvent.clientX - this.selectStartEvent.clientX;
    const height = this.selectCurrentEvent.clientY - this.selectStartEvent.clientY;

    // these are exact numbers BTW, not integers
    const minCol = left / this.noteWidth;
    const minRow = top / this.noteHeight;
    const maxCol = (left + width) / this.noteWidth;
    const maxRow = (top + height) / this.noteHeight;

    this.notes.forEach((note) => {
      note.selected = note.row > minRow && note.row < maxRow && note.col > minCol && note.col < maxCol;
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

  public add(row: number, e: MouseEvent) {
    const x = e.clientX - this.rows.getBoundingClientRect().left;
    const col = Math.floor(x / this.noteWidth);
    this.$log.debug(x, e.clientX, this.rows.getBoundingClientRect().left, col);
    const noteBar = {
      length: this.default,
      selected: false,
      row,
      col,
      ...this.compute(row, col),
    };

    this.notes.push(noteBar);
    this.$emit('added', noteBar);
    this.checkMeasure(noteBar);
  }
  public rowStyle(row: number, color: string) {
    return {
      height: `${this.noteHeight}px`,
      width: `${this.noteWidth * this.totalSixteenths}px`,
      backgroundColor: this.colorLookup[color],
    };
  }
  public move(e: MouseEvent, oldNote: NoteInfo) {
    const reft = this.rows.getBoundingClientRect();
    const row = Math.floor((e.clientY - reft.top) / this.noteHeight);
    const col = Math.floor((e.clientX - reft.left) / this.noteWidth);

    if (this.draggingIndex === null) {
      this.draggingIndex = this.notes.indexOf(oldNote);
    } else {
      oldNote = this.notes[this.draggingIndex];
    }

    if (row === oldNote.row && col === oldNote.col) { return; }

    const colDiff = col - oldNote.col;
    const rowDiff = row - oldNote.row;

    // TODO Merge if and else
    if (oldNote.selected) {
      this.notes.forEach((note, i) => {
        if (!note.selected) { return; }

        const newRow = note.row + rowDiff;
        const newCol = note.col + colDiff;
        const newNote = {
          length: note.length,
          selected: note.selected,
          row:  newRow,
          col: newCol,
          ...this.compute(newRow, newCol),
        };

        this.$set(this.notes, i, newNote);
        this.$emit('removed', note);
        this.$emit('added', newNote);
      });
    } else {
      const newNote = {
        length: oldNote.length,
        selected: oldNote.selected,
        row,
        col,
        ...this.compute(row, col),
      };

      this.$set(this.notes, this.draggingIndex, newNote);
      this.$emit('removed', oldNote);
      this.$emit('added', newNote);
    }


  }
  public remove(e: MouseEvent, item: any) {
    e.preventDefault();

    const i = this.notes.indexOf(item);
    if (i === -1) {
      throw Error(`${item} not found in the value. This should not happen.`);
    }

    this.removeAtIndex(i);
  }
  public removeAtIndex(i: number) {
    const item = this.notes[i];
    if (item === undefined) { throw Error(`${i} is out of range of notes`); }

    this.$delete(this.notes, i);

    let max = this.minMeasures;
    for (const note of this.notes) {
      const measure = Math.floor(note.col / (this.sixteenths * this.quarters));
      max = Math.max(measure, max);
    }

    this.$log.info(`The min measure is ${max}`);
    if (max < this.measures - 1) {
      this.$emit('update:measures', this.measures + 1);
    }

    this.$emit('removed', item);
  }
  public changeDefault(length: number) {
    this.default = length;
  }
  public compute(row: number, col: number) {
    let rem = col;
    const sixteenths = rem % this.sixteenths;
    rem = Math.floor(rem / this.sixteenths);
    const quarters = rem % this.quarters;
    const bars = Math.floor(rem / this.quarters);
    const time = `${bars}:${quarters}:${sixteenths}`;
    return {
      x: col * this.noteWidth,
      y: row * this.noteHeight,
      time,
      value: this.noteRows[row].value,
    };
  }
  public checkMeasure(note: NoteInfo) {
    const parts = note.time.split(':');
    if (parts.length === 0) {
      throw Error(`Invalid time: ${note.time}`);
    }

    const measureValue = parseInt(parts[0], 10) + 1;
    this.$log.debug(this.measures, measureValue);
    if (measureValue < this.measures) { return; }
    this.$emit('update:measures', measureValue + 1);
  }
  public clickNote(e: MouseEvent, note: NoteInfo) {
    if (!note.selected) { this.notes.forEach((n) => n.selected = false); }

    const createNote = (oldNote: NoteInfo) => {
      const newNote = JSON.parse(JSON.stringify(oldNote));
      oldNote.selected = false;
      this.notes.push(newNote);
      this.$emit('added', newNote);
      return newNote;
    };

    let targetNote = note;
    if (this.shift) {
      let selected: NoteInfo[];
      if (note.selected) {
        selected = this.notes.filter((n) => n.selected && n !== note);
        targetNote = createNote(note);
      } else {
        selected = [note];
      }

      selected.forEach(createNote);
    }
    this.addListeners(e, targetNote);
  }
  public keydown(e: KeyboardEvent) {
    if (e.keyCode === Keys.SHIFT) {
      this.shift = true;
    } else if (e.keyCode === Keys.DELETE) {
      // Slice and reverse since we will be deleting from the array as we go
      const lastIndex = this.notes.length - 1;
      this.notes.slice().reverse().forEach((note, i) => {
        if (note.selected) { this.removeAtIndex(lastIndex - i); }
      });
    }
  }
  public keyup(e: KeyboardEvent) {
    if (e.keyCode === Keys.SHIFT) { this.shift = false; }
  }

  public mounted() {
    this.rows = this.$refs.rows as HTMLElement;
    // Make a shallow copy so we don't alter the prop
    this.notes = this.value ? this.value.slice() : [];
    this.notes.map((note) => {
      this.$emit('added', note);
      this.checkMeasure(note);
    });

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

.sequencer
  position: relative
  overflow: hidden

.sequencer-child
  position: relative
  overflow-x: scroll
</style>
