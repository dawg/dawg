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
        v-for="(note, i) in value"
        :key="i"
        :start="note.time"
        :id="note.id"
        :selected="selected[i]"
        style="position: absolute; z-index: 2"
        @contextmenu="remove($event, i)"
        @mousedown="clickNote($event, i)"
        @input="changeDefault"
        v-model="note.duration"
      ></note>
      <progression
        :loop-start="loopStart"
        :loop-end="loopEnd"
        :progress="progress"
        class="progress-bar"
      ></progression>
      <div 
        class="loop-background loop-background--left" 
        :style="leftStyle"
      ></div>
      <div 
        class="loop-background loop-background--right" 
        :style="rightStyle"
      ></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Inject } from 'vue-property-decorator';
import { Draggable } from '@/mixins';
import { Keys } from '@/utils';
import { FactoryDictionary } from 'typescript-collections';
import { allKeys, range, copy, Nullable } from '@/utils';
import NoteComponent from '@/components/Note.vue';
import { Note } from '@/schemas';
import BeatLines from '@/components/BeatLines';
import SequencerRow from '@/components/SequencerRow.vue';
import Progression from '@/components/Progression.vue';
import { Watch } from '@/modules/update';

@Component({
  components: { Note: NoteComponent, SequencerRow, Progression },
})
export default class Sequencer extends Mixins(Draggable, BeatLines) {
  @Inject() public noteHeight!: number;
  @Inject() public stepsPerBeat!: number;

  @Prop({ type: Array, required: true }) public value!: Note[];
  @Prop({ type: Number, default: 1 }) public defaultLength!: number;
  @Prop({ type: Number, default: 0.25 }) public snap!: number;

  @Prop({ type: Number, required: true }) public loopEnd!: number | null;
  @Prop({ type: Number, required: true }) public loopStart!: number | null;

  // These values should only be set if there is a loop on the timeline
  @Prop(Nullable(Number)) public setLoopEnd!: number | null;
  @Prop(Nullable(Number)) public setLoopStart!: number | null;
  @Prop({ type: Number, required: true }) public progress!: number;


  public cursor = 'move';
  public default = this.defaultLength;  // To avoid mutating a prop
  public rows!: HTMLElement;
  public selectStartEvent: MouseEvent | null = null;
  public selectCurrentEvent: MouseEvent | null = null;
  public holdingShift = false;
  public allKeys = allKeys;
  public minDisplayMeasures = 4;
  public noteLoopEnd: number | null = null;
  public selected: boolean[] = [];

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
  get leftStyle() {
    if (this.setLoopStart) {
      return {
        width: `${this.setLoopStart * this.pxPerBeat}px`,
      };
    }
  }
  get rightStyle() {
    if (this.setLoopEnd) {
      const left = this.setLoopEnd * this.pxPerBeat;
      return {
        left: `${left}px`,
        width: `${this.displayBeats * this.pxPerBeat - left}px`,
      };
    }
  }
  get displayBeats() {
    return Math.max(
      this.minDisplayMeasures * this.beatsPerMeasure,
      this.noteLoopEnd || 0,
    ) * this.stepsPerBeat;
  }
  public get selectStyle() {
    if (!this.selectStartEvent) { return; }
    if (!this.selectCurrentEvent) {
      this.selected = this.selected.map((_) => false);
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

    this.value.forEach((note, i) => {
      // Check if there is any overlap between the rectangles
      // https://www.geeksforgeeks.org/find-two-rectangles-overlap/
      if (minRow > note.id + 1 || note.id > maxRow) {
        this.selected[i] = false;
      } else if (minBeat > note.time + note.duration || note.time > maxBeat) {
        this.selected[i] = false;
      } else {
        this.selected[i] = true;
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
      duration: this.default,
      selected: false,
      id,
      time,
    };

    this.selected.push(false);
    this.value.push(note);
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

    const oldNote = this.value[i];
    if (row === oldNote.id && time === oldNote.time) { return; }

    const timeDiff = time - oldNote.time;
    const rowDiff = row - oldNote.id;

    let notesToMove: Array<[Note, number]>;
    if (this.selected[i]) {
      notesToMove = this.value.map((note, ind) => {
        return [note, ind] as [Note, number];
      }).filter(([note, ind]) => this.selected[i]);
    } else {
      notesToMove = [[oldNote, i]];
    }

    notesToMove.forEach(([note, ind]) => {
      const newTime = note.time + timeDiff;
      const newNote = {
        duration: note.duration,
        time: newTime,
        id: note.id + rowDiff,
      };

      this.$set(this.value, ind, newNote);
      this.$emit('removed', note, ind);
      this.$emit('added', newNote);
      this.checkLoopEnd();
    });
  }
  public remove(e: MouseEvent, i: number) {
    e.preventDefault();
    this.removeAtIndex(i);
  }
  public removeAtIndex(i: number) {
    const item = this.value[i];
    this.$delete(this.selected, i);
    this.$delete(this.value, i);
    this.$emit('removed', item, i);
    this.checkLoopEnd();
  }
  public checkLoopEnd() {
    let maxTime = Math.max(...this.value.map((note) => note.time), 0);

    // Add a tiny amount to max time so that ceil will push to next number
    // if maxTime is a whole number
    maxTime = maxTime + 0.0000001;
    const noteLoopEnd = Math.ceil(maxTime / this.beatsPerMeasure) * this.beatsPerMeasure;

    this.$log.debug(`noteLoopEnd -> ${noteLoopEnd}`);
    if (noteLoopEnd !== this.noteLoopEnd) {
      this.$emit('loop-end', noteLoopEnd);
      this.noteLoopEnd = noteLoopEnd;
    }
  }
  public changeDefault(length: number) {
    this.default = length;
  }
  public clickNote(e: MouseEvent, i: number) {
    const note = this.value[i];
    if (!this.selected[i]) {
      this.value.forEach((_, ind) => this.selected[ind] = false);
    }

    const createNote = (oldNote: Note) => {
      const newNote = copy(oldNote);

      // We do this because `newNew` will have a heigher z-index
      // Thus, it will be displayed on top (which we want)
      this.selected.push(false);
      this.value.push(newNote);
      this.$emit('added', newNote);
    };

    let targetIndex = i;
    if (this.holdingShift) {
      let selected: Note[];

      // If selected, copy all selected. If not, just copy the note that was clicked.
      if (this.selected[i]) {
        selected = this.value.filter((n, ind) => this.selected[ind] && n !== note);
        targetIndex = this.value.length; // A copy of `note` will be created at this index
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
      const lastIndex = this.value.length - 1;
      this.value.slice().reverse().forEach((note, i) => {
        if (this.selected[i]) {
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
    this.checkLoopEnd();
    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);
  }

  public destroyed() {
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
  }

  @Watch<Sequencer>('value', { immediate: true })
  public resetSelectedIfNecessary() {
    // Whenever the parent changes the notes
    // we should reset the selected!
    // Also, since we are watching `value`, we modify `selected` first so that
    // this method doesn't trigger before `selected` is also changed.
    if (this.selected.length !== this.value.length) {
      this.selected = this.value.map((_) => false);

      // TODO(jacob) this won't always work
      this.value.forEach((note) => this.$emit('added', note));
    }
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

.progress-bar
  width: 1px
  background-color: #ffa
  box-shadow: -1px 0 2px #ffa
  z-index: 2
  top: 0
  bottom: 0
  pointer-events: none

.loop-background
  opacity: 0
  background-color: #000
  transition: .2s opacity
  opacity: 0.2
  position: absolute
  // TODO duplicate
  z-index: 2
  top: 0
  bottom: 0
  pointer-events: none

.loop-background--left
  left: 0
</style>
