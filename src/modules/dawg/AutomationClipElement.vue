<template>
  <svg 
    class="envelope-visualizer" 
    :viewBox="viewBox" 
    preserveAspectRatio="xMinYMid slice"
    :height="trackHeight"
    :width="width"
  >
    <path 
      class="envelope-shape primary--stroke" 
      :d="path" 
      fill="transparent"
      stroke-width="2"
    ></path>

    <drag-element
      v-for="(point, i) in processed"
      :key="i"
      tag="circle"
      curse="pointer"
      @move="move($event, i)"
      v-bind="point"
      :r="radius"
      class="primary--stroke"
      fill="#284554" 
      stroke="#4eccff" 
      stroke-width="2"
    ></drag-element>
    
  </svg>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import { Point } from '@/schemas';

@Component
export default class AutomationClipElement extends Vue {
  @Inject() public pxPerBeat!: number;
  @Inject() public trackHeight!: number;
  @Inject() public snap!: number;

  @Prop({ type: Number, default: 4 }) public radius!: number;
  @Prop({ type: Array, required: true }) public points!: Point[];

  get processed() {
    return this.points.sort(this.sort).map((point) => {
      return {
        cx: point.time * this.pxPerBeat,
        cy: point.value * this.trackHeight,
      };
    });
  }

  get times() {
    return this.points.map(({ time }) => time);
  }

  get maxTime() {
    return Math.max(...this.times);
  }

  get width() {
    return this.maxTime * this.pxPerBeat;
  }

  get viewBox() {
    return `0 0 ${this.width} ${this.trackHeight}`;
  }

  get path() {
    if (this.processed.length < 1) {
      return [];
    }

    const points =  [
      { letter: 'M', point: this.processed[0] },
      ...this.processed.slice(1).map((point) => ({ letter: 'L', point })),
    ];

    return points.map(({ letter, point }) => `${letter} ${point.cx} ${point.cy}`).join(' ');
  }

  public move(e: MouseEvent, i: number) {
    // TODO duplication
    const rect = this.$el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let time = x / this.pxPerBeat;

    const lowerBound = i === 0 ? 0 : this.points[i - 1].time;
    const upperBound = i === this.points.length - 1 ? Infinity : this.points[i + 1].time;

    time = Math.round(time / this.snap) * this.snap;
    time = Math.max(lowerBound, Math.min(upperBound, time));

    const point = this.points[i];
    let value = (e.clientY - rect.top) / this.trackHeight;
    value = Math.max(0, Math.min(1, value));

    this.$set(this.points, i, { time, value });
  }

  public sort(a: Point, b: Point) {
    return a.time - b.time;
  }
}
</script>

<style lang="sass" scoped>
.envelope-visualizer
  overflow: visible
</style>