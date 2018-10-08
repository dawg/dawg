<template>
  <v-stage :config="canvasConfig">
    <v-layer>
      <div v-for="(note, row) in notes" :key="note.value">
        <template v-for="col in totalSixteenths">
          <v-rect
              :key="col"
              :config="rectConfig(row, col - 1, note.color)"
              @click="add(row, col - 1)"
          ></v-rect>
        </template>
      </div>
    </v-layer>
    <v-layer>
      <template v-for="col in totalSixteenths">
        <v-line :config="borderConfig(col)" :key="col"></v-line>
      </template>
    </v-layer>
    <v-layer>
      <template v-for="(note, i) in value">
        <!--suppress JSUnresolvedVariable -->
        <note
            :key="i"
            :height="noteHeight"
            :width="noteWidth"
            :x="note.x"
            :y="note.y"
            @contextmenu="(e) => remove(e, i)"
            @mousedown="addListeners($event, note)"
            @input="changeDefault"
            v-model="note.length"
        ></note>
      </template>
    </v-layer>
  </v-stage>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator';
import { Draggable, PX } from '@/mixins';
import { FactoryDictionary } from 'typescript-collections';
import { notes, range, BLACK, WHITE } from '@/utils';
import Note from '@/components/Note.vue';

interface Lookup {
  [key: string]: NoteInfo;
}

interface Colors {
  [key: string]: string;
}

interface NoteInfo {
  row: number;
  col: number;
  index: number;
  value: string;
  length: number;
}

interface BasicNoteInfo {
  value: string;
  color: string;
}

@Component({
  components: { Note },
})
export default class Sequencer extends Mixins(Draggable, PX) {
  @Prop({ type: Number, required: true }) public noteHeight!: number;
  @Prop({ type: Number, required: true }) public noteWidth!: number;
  @Prop(Number) public width!: number;
  @Prop(Number) public height!: number;
  @Prop(Array) public value!: any[];
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
  public farthest = [];

  get canvasConfig() {
    return {
      height: this.height || this.notes.length * this.noteHeight,
      width: this.width || this.totalSixteenths * this.noteWidth,
    };
  }
  get colorLookup(): Colors {
    return { [BLACK]: this.blackColor, [WHITE]: this.whiteColor };
  }
  get totalSixteenths() {
    // we always render 1 extra measure
    return (this.measures + 1) * this.quarters * this.sixteenths;
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

  public add(row: number, col: number) {
    const noteBar = {
      length: this.default,
      row,
      col,
      index: this.value.length,
      ...this.compute(row, col),
    };

    this.lookup[`${row}-${col}`] = noteBar;
    this.$emit('input', [...this.value, noteBar]);
    this.$emit('added', noteBar);
    this.checkMeasure(col);
  }
  public rectConfig(row: number, col: number, color: string) {
    return {
      height: this.noteHeight,
      width: this.noteWidth,
      fill: this.colorLookup[color],
      x: col * this.noteWidth,
      y: row * this.noteHeight,
    };
  }
  public borderConfig(col: number) {
    let strokeWidth;
    if (col % (this.quarters * this.sixteenths) === 0) {
      strokeWidth = 2.4;
    } else if (col % this.sixteenths === 0) {
      strokeWidth = 1.5;
    } else {
      strokeWidth = 0.4;
    }

    const start = [col * this.noteWidth, 0];
    const end = [col * this.noteWidth, (this.notes.length) * this.noteHeight];
    return {
      points: [...start, ...end],
      strokeWidth,
      stroke: '#000',
    };
  }
  public move(e: MouseEvent, note: NoteInfo) {
    const row = Math.floor(e.clientY / this.noteHeight);
    const col = Math.floor(e.clientX / this.noteWidth);

    const oldNote = this.get(note.row, note.col);
    const newNote = {
      ...oldNote, row, col, ...this.compute(row, col),
    };

    this.set(row, col, newNote);

    this.$set(this.value, oldNote.index, newNote);
    this.$emit('input', this.value);
    this.$emit('added', newNote);
  }
  public get(row: number, col: number) {
    return this.lookup[`${row}-${col}`];
  }
  public set(row: number, col: number, value: NoteInfo) {
    this.lookup[`${row}-${col}`] = value;
  }
  public remove(e: MouseEvent, i: number) {
    e.preventDefault();

    const toRemove = this.value[i];
    this.$delete(this.value, i);
    this.value.slice(0, i).map((note) => { note.index -= 1; });

    // TODO XXX !!!
    // if (this.farthest.length || toRemove.col === this.farthest[this.farthest.length - 1]) {
    //   this.farthest.splice();
    // }

    this.$emit('input', this.value);
    this.$emit('removed', toRemove);
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
  public checkMeasure(col: number) {
    let measureValue = col / (this.quarters * this.sixteenths);
    if (measureValue === this.measures) { this.$emit('update:measures', measureValue + 1); } else {
      measureValue = Math.ceil(measureValue);
      if (measureValue > this.measures) {
        this.$emit('update:measures', measureValue);
      } else if (measureValue < this.measures) {
        this.$emit('update:measures', measureValue);
      }
    }
  }

  public mounted() {
    this.value.map((note) => {
      this.$emit('added', note);
      this.checkMeasure(note.col);
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
</style>
