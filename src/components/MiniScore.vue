<template>
  <!-- scale(-1, 1) flips the svg vertically -->
  <svg
    preserveAspectRatio="none"
    class="mini-score primary--text"
    :viewBox="viewBox"
  >
    <rect
      v-for="rect in rects"
      :key="rect.key"
      :x="rect.x"
      :y="rect.y"
      :height="rect.height"
      :width="rect.width"
    ></rect>
  </svg>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import { Note } from '@/core';

/**
 * This class is used in the synth components to show the score associated with that synth.
 * We display a miniature version and adjust the size of the notes based on the min/max values.
 */
@Component
export default class MiniScore extends Vue {
  // @Prop({ type: Number, required: true }) public beatsPerMeasure!: number;
  @Prop({ type: Array, required: true }) public notes!: Note[];
  // The height and width are only used to set the aspect ratio.
  // Use css to actually define the height and width
  @Prop({ type: Number, default: 32 }) public height!: number;
  @Prop({ type: Number, default: 200 }) public width!: number;
  @Prop({ type: Number, default: 0 }) public offset!: number;

  get viewBox() {
    return `0 0 ${this.width} ${this.height}`;
  }
  get rows() {
    return this.notes.map(({ row }) => row);
  }
  get minRow() {
    const minRow = Math.min(...this.rows);
    return minRow - minRow % 12;
  }
  get maxRow() {
    const maxRow = Math.max(...this.rows);
    return maxRow + 11 - maxRow % 12;
  }
  get difference() {
    return this.maxRow - this.minRow + 1;
  }
  get endTimes() {
    return this.notes.map(({ time, duration }) => time + duration);
  }
  get totalDuration() {
    return Math.max(...this.endTimes); // , this.beatsPerMeasure
  }
  get rowHeight() {
    return this.height / this.difference;
  }
  get columnWidth() {
    return this.width / this.totalDuration;
  }
  get rects() {
    return this.notes.map(({ row, time, duration }) => {
      const actualRow = row - this.minRow;
      const x = (time - this.offset) * this.columnWidth;
      const width = duration * this.columnWidth;
      if (x + width > 0 && x < this.width) {
        return {
          x: `${x}px`,
          width: `${width}px`,
          y: actualRow * this.rowHeight + 'px',
          height: `${this.rowHeight}px`,
        };
      }
    }).filter((rect) => rect);
  }
}
</script>

<style lang="sass" scoped>
.mini-score
  height: 100%
  width: 100%

svg
  fill: currentColor
</style>