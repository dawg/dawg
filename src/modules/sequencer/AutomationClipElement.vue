<template>
  <svg 
    class="envelope-visualizer" 
    :viewBox="viewBox" 
    preserveAspectRatio="xMinYMid slice"
    :height="height"
    :width="width"
    @click="addPoint"
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
      @contextmenu.native="pointContext($event, i)"
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
import { Point, ScheduledAutomation } from '@/core';
import { scale } from '@/utils';

@Component
export default class AutomationClipElement extends Vue {
  @Prop({ type: Number, required: true }) public pxPerBeat!: number;
  // TODO small bug height !== true height
  @Prop({ type: Number, required: true }) public height!: number;
  @Prop({ type: Number, required: true }) public snap!: number;

  @Prop({ type: Number, default: 4 }) public radius!: number;
  @Prop({ type: Object, required: true }) public element!: ScheduledAutomation;

  get clip() {
    return this.element.clip;
  }

  get points() {
    return this.clip.points;
  }

  get minValue() {
    return this.clip.signal.minValue;
  }

  get maxValue() {
    return this.clip.signal.maxValue;
  }

  get fromRange(): [number, number] {
    return [this.minValue, this.maxValue];
  }

  get processed() {
    return this.points.sort(this.sort).map((point) => {
      return {
        cx: point.time * this.pxPerBeat,
        cy: scale(point.value, this.fromRange, [0, 1]) * this.height,
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
    return `0 0 ${this.width} ${this.height}`;
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

  public getTimeValue(e: MouseEvent) {
    // TODO duplication
    const rect = this.$el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let time = x / this.pxPerBeat;

    time = Math.round(time / this.snap) * this.snap;
    const value = (e.clientY - rect.top) / this.height;

    return {
      time,
      value,
    };
  }

  public addPoint(e: MouseEvent) {
    const { time, value } = this.getTimeValue(e);
    this.clip.add(time, value);
  }

  public move(e: MouseEvent, i: number) {
    // We still NEED to put bounds on the returned values as
    // it is possible to move out of bounds
    let { time, value } = this.getTimeValue(e);

    const lowerBound = i === 0 ? 0 : this.points[i - 1].time;
    const upperBound = i === this.points.length - 1 ? Infinity : this.points[i + 1].time;
    time = Math.max(lowerBound, Math.min(upperBound, time));

    this.clip.setTime(i, time);
    // TODO this needs a better home
    this.element.duration = Math.max(this.element.duration, time);

    value = Math.max(0, Math.min(1, value));
    value = scale(value, [0, 1], this.fromRange);

    this.$log.debug(`Changing ${this.clip.points[i].value} -> ${value}`);
    this.clip.setValue(i, value);
    this.$set(this.points, i, this.points[i]);
  }

  public sort(a: Point, b: Point) {
    return a.time - b.time;
  }

  public delete(i: number) {
    this.clip.remove(i);
  }

  public pointContext(event: MouseEvent, i: number) {
    this.$context({
      event,
      items: [
        {
          text: 'Delete',
          callback: () => this.delete(i),
        },
      ],
    });
  }
}
</script>

<style lang="sass" scoped>
.envelope-visualizer
  overflow: visible
</style>