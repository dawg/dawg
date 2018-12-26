<template>
  <svg
    preserveAspectRatio="none"
    class="mini-score secondary primary--text"
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
import { Note } from '@/models';
import { max } from 'fp-ts/lib/Ord';

@Component
export default class MiniScore extends Vue {
  @Inject() public beatsPerMeasure!: number;
  @Prop({ type: Array, required: true }) public notes!: Note[];
  @Prop({ type: Number, default: 32 }) public height!: number;
  @Prop({ type: Number, default: 200 }) public width!: number;
  @Prop({ type: Number, default: 0 }) public offset!: number;
  @Prop(Number) public duration?: number;

  get viewBox() {
    return `0 0 ${this.width} ${this.height}`;
  }
  get rows() {
    return this.notes.map(({ id }) => id);
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
    return Math.max(...this.endTimes, this.beatsPerMeasure);
  }
  get rowHeight() {
    return this.height / this.difference;
  }
  get columnWidth() {
    return this.width / (this.duration || this.totalDuration);
  }
  get rects() {
    return this.notes.map(({ id, time, duration }) => {
      const row = this.difference - (id - this.minRow);
      const x = (time - this.offset) * this.columnWidth;
      const width = duration * this.columnWidth;
      if (x + width > 0 && x < this.width) {
        return {
          x: `${x}px`,
          width: `${width}px`,
          y: row * this.rowHeight + 'px',
          height: `${this.rowHeight}px`,
        };
      }
    }).filter((rect) => rect);
  }
}
</script>

<style lang="sass" scoped>
svg
  fill: currentColor
</style>