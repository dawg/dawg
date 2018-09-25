<template>
  <v-stage :config="canvasConfig">
    <v-layer>
      <div v-for="(note, row) in noteValues" :key="note.value">
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
      <template v-for="(note, i) in notes">
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

<script>
import { draggable, px } from '@/mixins';
import { notes, range, BLACK, WHITE, DefaultDict } from '@/utils';
import Note from '@/components/Note.vue';

let noteValues = [];
// eslint-disable-next-line array-callback-return
[4, 5].map((octave) => {
  notes.map(note => noteValues.push({ ...note, value: note.value + octave }));
});
noteValues = noteValues.reverse();

export default {
  name: 'Sequencer',
  components: { Note },
  mixins: [px, draggable],
  props: {
    noteHeight: { type: Number, required: true },
    noteWidth: { type: Number, required: true },
    width: Number,
    height: Number,
    blackColor: { type: String, default: '#21252b' },
    whiteColor: { type: String, default: '#282c34' },
    defaultLength: { type: Number, default: 1 },
    measures: { type: Number, required: true },
    notes: { type: Array, default: () => [] },
  },
  data() {
    return {
      lineColor: '#000',
      quarters: 4,
      sixteenths: 4,
      lookup: new DefaultDict(new DefaultDict(Array)),
      cursor: 'move',
      default: null,
      farthest: [],
      movingNote: null,
      noteValues,
    };
  },
  computed: {
    canvasConfig() {
      return {
        height: this.height || noteValues.length * this.noteHeight,
        width: this.width || this.totalSixteenths * this.noteWidth,
      };
    },
    colorLookup() {
      return { [BLACK]: this.blackColor, [WHITE]: this.whiteColor };
    },
    totalSixteenths() {
      // we always render 1 extra measure
      return (this.measures + 1) * this.quarters * this.sixteenths;
    },
  },
  methods: {
    range,
    add(row, col) {
      const noteBar = {
        length: this.default, row, col, index: this.notes.length, ...this.compute(row, col),
      };
      this.lookup[row][col] = noteBar;
      this.notes.push(noteBar);
      this.$emit('added', noteBar);
      this.checkMeasure(col);
    },
    rectConfig(row, col, color) {
      return {
        height: this.noteHeight,
        width: this.noteWidth,
        fill: this.colorLookup[color],
        x: col * this.noteWidth,
        y: row * this.noteHeight,
      };
    },
    borderConfig(col) {
      let strokeWidth;
      if (col % (this.quarters * this.sixteenths) === 0) strokeWidth = 2.4;
      else if (col % this.sixteenths === 0) strokeWidth = 1.5;
      else strokeWidth = 0.4;

      const start = [col * this.noteWidth, 0];
      const end = [col * this.noteWidth, (noteValues.length) * this.noteHeight];
      return {
        points: [...start, ...end],
        strokeWidth,
        stroke: '#000',
      };
    },
    onMouseUp() {
      const { row, col, note } = this.movingNote;
      const newNote = this.lookup[row][col];
      this.$emit('moved', { newTime: newNote.time, oldTime: note.time, note: newNote.note });
      this.movingNote = null;
    },
    move(e, note) { // TODO remove note
      const row = Math.floor(e.clientY / this.noteHeight);
      const col = Math.floor(e.clientX / this.noteWidth);

      if (!this.movingNote) this.movingNote = { row, col, note }; // TODO this

      const oldNote = this.notes[note.index];
      if (row === oldNote.row && col === oldNote.col) return;

      const newNote = {
        ...oldNote, row, col, ...this.compute(row, col),
      };

      this.lookup[row][col] = newNote;

      console.log(0);
      this.$set(this.notes, oldNote.index, newNote);
    },
    remove(e, i) {
      e.preventDefault();

      const toRemove = this.notes[i];

      this.notes.splice(i, 1);

      for (let j = 0; j < i; j += 1) this.notes.index -= 1;

      // TODO XXX !!!
      // if (this.farthest.length || toRemove.col === this.farthest[this.farthest.length - 1]) {
      //   this.farthest.splice();
      // }

      this.$emit('removed', toRemove);
    },
    changeDefault(length) {
      this.default = length;
    },
    compute(row, col) {
      let rem = col;
      const sixteenths = rem % this.sixteenths; rem = Math.floor(rem / this.sixteenths);
      const quarters = rem % this.quarters; const bars = Math.floor(rem / this.quarters);
      const time = `${bars}:${quarters}:${sixteenths}`;
      return {
        x: col * this.noteWidth, y: row * this.noteHeight, time, note: noteValues[row].value,
      };
    },
    checkMeasure(col) {
      let measureValue = col / (this.quarters * this.sixteenths);
      if (measureValue === this.measures) this.$emit('update:measures', measureValue + 1);
      else {
        measureValue = Math.ceil(measureValue);
        if (measureValue > this.measures) this.$emit('update:measures', measureValue);
        else if (measureValue < this.measures) this.$emit('update:measures', measureValue);
      }
    },
  },
  mounted() {
    this.default = this.defaultLength;
    // eslint-disable-next-line array-callback-return
    this.notes.map((note) => {
      this.$emit('added', note);
      this.checkMeasure(note.col);
    });
  },
};
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
