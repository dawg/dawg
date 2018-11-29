<template>
  <div :style="sequencerStyle" class="sequencer">
    <div class="layer rows" :style="`height: ${notes.length * noteHeight}px`">
      <div
        v-for="(note, row) in notes" 
        :key="note.value"
        :style="rowStyle(row, note.color)"
        @click="add(row, $event)"
      ></div>
    </div>
    <div :style="sequencerStyle" class="layer lines" ref="beatLines"></div>
    <note
      v-for="(note, i) in value"
      :key="i"
      :height="noteHeight"
      :width="noteWidth"
      :x="note.x"
      :y="note.y"
      style="position: absolute; z-index: 2"
      @contextmenu="remove($event, note)"
      @mousedown="addListeners($event, note)"
      @input="changeDefault"
      v-model="note.length"
    ></note>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator';
import { Draggable, PX } from '@/mixins';
import { FactoryDictionary } from 'typescript-collections';
import { notes, range, BLACK, WHITE } from '@/utils';
import Note from '@/components/Note.vue';
import { NoteInfo } from '@/types';
import BeatLines from '@/components/BeatLines';

interface Lookup {
  [key: string]: NoteInfo;
}

interface Colors {
  [key: string]: string;
}

interface BasicNoteInfo {
  value: string;
  color: string;
}

@Component({
  components: { Note },
})
export default class Sequencer extends Mixins(Draggable, PX, BeatLines) {
  @Prop({ type: Number, required: true }) public noteHeight!: number;
  // @Prop({ type: Number, required: true }) public noteWidth!: number;
  @Prop(Array) public value!: NoteInfo[];
  @Prop({ type: String, default: '#21252b' }) public blackColor!: string;
  @Prop({ type: String, default: '#282c34' }) public whiteColor!: string;
  @Prop({ type: Number, default: 1 }) public defaultLength!: number;
  @Prop({ type: Number, required: true }) public measures!: number;

  public lineColor = '#000';
  public quarters = 4;
  public sixteenths = 4;
  public lookup: Lookup = {};
  public cursor = 'move';
  public default = this.defaultLength;
  public octaves = [4, 5];
  public draggingIndex: number | null = null;

  public get noteWidth() {
    return this.pxPerBeat / 4;
  }

  get sequencerStyle() {
    return {
      height: `${this.notes.length * this.noteHeight}px`,
      width: `${this.totalSixteenths * this.noteWidth}px`,
    };
  }
  get colorLookup(): Colors {
    return { [BLACK]: this.blackColor, [WHITE]: this.whiteColor };
  }
  get totalSixteenths() {
    return this.measures * this.quarters * this.sixteenths;
  }
  get notes() {
    const n: BasicNoteInfo[] = [];
    this.octaves.map((octave) => {
      notes.map((note) => n.push({
        color: note.color,
        value: note.value + octave,
      }));
    });
    return n.reverse();
  }
  public leftPxValue() {
    return this.$el.getBoundingClientRect().left;
  }
  public afterMove() {
    this.draggingIndex = null;
  }

  public add(row: number, e: MouseEvent) {
    const x = e.clientX - this.leftPxValue();
    const col = Math.floor(x / this.noteWidth);
    const noteBar = {
      length: this.default,
      row,
      col,
      ...this.compute(row, col),
    };

    this.$emit('input', [...this.value, noteBar]);
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
    const reft = this.$el.getBoundingClientRect();
    const row = Math.floor((e.clientY - reft.top) / this.noteHeight);
    const col = Math.floor((e.clientX - reft.left) / this.noteWidth);

    if (this.draggingIndex === null) {
      this.draggingIndex = this.value.indexOf(oldNote);
    } else {
      oldNote = this.value[this.draggingIndex];
    }

    if (row === oldNote.row && col === oldNote.col) { return; }

    const newNote = {
      length: oldNote.length,
      row,
      col,
      ...this.compute(row, col),
    };

    this.$set(this.value, this.draggingIndex, newNote);
    this.$emit('added', newNote);
  }
  public remove(e: MouseEvent, item: any) {
    e.preventDefault();

    const i = this.value.indexOf(item);
    if (i === -1) {
      throw Error(`${item} not found in the value. This should not happen.`);
    }

    this.$delete(this.value, i);

    let max = this.measures;
    for (const note of this.value) {
      const measure = Math.floor(note.col / (this.sixteenths * this.quarters));
      max = Math.min(measure, max);
    }

    this.$log.info(`The min measure is ${max}`);
    if (max < this.measures - 1) {
      this.$emit('update:measures', this.measures + 1);
    }

    this.$emit('input', this.value);
    this.$emit('removed', item);
  }
  public changeDefault(length: number) {
    this.default = length;
  }
  public compute(row: number, col: number) {
    let rem = col;
    const sixteenths = rem % this.sixteenths; rem = Math.floor(rem / this.sixteenths);
    const quarters = rem % this.quarters; const bars = Math.floor(rem / this.quarters);
    const time = `${bars}:${quarters}:${sixteenths}`;
    return {
      x: col * this.noteWidth,
      y: row * this.noteHeight,
      time,
      value: this.notes[row].value,
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

  public mounted() {
    this.value.map((note) => {
      this.$emit('added', note);
      this.checkMeasure(note);
    });
  }
}
</script>

<style scoped lang="sass">
.sequencer
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
</style>
