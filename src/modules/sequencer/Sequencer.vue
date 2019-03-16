<template>
  <div class="sequencer">
    <div style="display: flex">
      <div class="empty-block secondary" :style="style"></div>
      <scroller
        :scroller="horizontalScroller"
        :increment="pxPerStep"
        direction="horizontal"
        @update:increment="setPxPerBeat"
        style="width: 100%"
        @scroll="scroll"
      >
        <timeline 
          v-model="progress" 
          class="timeline"
          :set-loop-end.sync="setLoopEnd"
          :set-loop-start.sync="setLoopStart"
          :loop-start="loopStart"
          :loop-end="loopEnd"
          :offset="offset"
          :steps-per-beat="stepsPerBeat"
          :beats-per-measure="beatsPerMeasure"
          :px-per-beat.sync="pxPerBeat"
          @seek="seek"
        ></timeline>
      </scroller>
    </div>
    <vue-perfect-scrollbar 
      style="overflow-y: scroll; display: flex; height: calc(100% - 20px)"
      :settings="{ handlers: ['wheel'] }"
      ref="scrollY"
    >
      <!-- Use a wrapper div to add width attribute -->
      <scroller 
        :style="style" 
        class="side-wrapper"
        direction="vertical"
        :scroller="verticalScroller"
        :increment="rowHeight"
        @update:increment="setRowHeight"
      >
        <slot 
          name="side"
        ></slot>
      </scroller>
      <vue-perfect-scrollbar
        class="sequencer sequencer-child" 
        @ps-scroll-x="scroll" 
        ref="scroller"
        style="height: fit-content"
        :settings="{ suppressScrollY: true, handlers: ['wheel'] }"
      >
        <arranger
          @added="added"
          @removed="removed"
          :elements="elements"
          :sequencer-loop-end.sync="sequencerLoopEnd"
          :loop-start="loopStart"
          :loop-end="loopEnd"
          :set-loop-start="setLoopStart"
          :set-loop-end="setLoopEnd"
          :steps-per-beat="stepsPerBeat"
          :beats-per-measure="beatsPerMeasure"
          :px-per-beat="pxPerBeat"
          :row-height="rowHeight"
          :progress="progress"
          :name="name"
          v-bind="$attrs"
          v-on="$listeners"
        ></arranger>
      </vue-perfect-scrollbar>

    </vue-perfect-scrollbar>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import Tone from 'tone';
import { Watch } from '@/modules/update';
import { Element as El } from '@/schemas';
import Transport from '@/modules/audio/transport';
import { toTickTime, clamp } from '@/utils';
import Arranger from '@/modules/sequencer/Arranger.vue';
import Timeline from '@/modules/sequencer/Timeline.vue';

@Component({
  components: { Arranger, Timeline },
})
export default class Sequencer extends Vue {
  @Prop({ type: Number, required: true }) public stepsPerBeat!: number;
  @Prop({ type: Number, required: true }) public beatsPerMeasure!: number;
  @Prop({ type: Number, required: true }) public rowHeight!: number;
  @Prop({ type: Number, required: true }) public pxPerBeat!: number;

  @Prop({ type: String, required: true }) public name!: string;
  @Prop({ type: Number, default: 80 }) public sideWidth!: number;
  @Prop({ type: Array, required: true }) public elements!: El[];
  @Prop({ type: Boolean, default: false }) public play!: boolean;
  @Prop({ type: Object, required: true }) public transport!: Transport;
  @Prop(Number) public end!: number;
  @Prop(Number) public start!: number;

  public loopStart = 0;
  public loopEnd = 0;
  public scrollLeft = 0;
  public progress = 0;
  public sequencerLoopEnd = 0;
  public setLoopStart: null | number = null;
  public setLoopEnd: null | number = null;

  public verticalScroller: Element | null = null;
  public horizontalScroller: Element | null = null;

  // The anchor is used to steady resizing
  // Try resizing the width/height and you will notice that that the position
  // under the mouse stays fixed. The anchor is what enables this to occur.
  // It will contains a floating point number where the integer part represents
  // the row/column and the floating point represens the exact location within
  // the next/row column.
  public anchor = 0;

  public $refs!: {
    scroller: Vue;
    scrollY: Vue;
  };

  // Horizontal offset in beats.
  // Used to offset the timeline
  get offset() {
    return this.scrollLeft / this.pxPerBeat;
  }

  get style() {
    return {
      minWidth: `${this.sideWidth}px`,
    };
  }

  get pxPerStep() {
    return this.pxPerBeat / this.stepsPerBeat;
  }

  public seek(beat: number) {
    const time = toTickTime(beat);
    this.transport.seconds = new Tone.Time(time).toSeconds();
    this.update();
  }

  public added(element: El) {
    this.$log.debug(`Adding element at ${element.time}`);
    element.schedule(this.transport);
  }

  public removed(element: El) {
    this.$log.debug(`Removing element at ${element.time}`);
    element.remove(this.transport);
  }

  public update() {
    if (this.transport.state === 'started') { requestAnimationFrame(this.update); }
    this.progress = this.transport.progress;
  }

  public scroll() {
    // This only handles horizontal scrolls!
    this.scrollLeft = this.$refs.scroller.$el.scrollLeft;
  }

  public setPxPerBeat(pxPerStep: number) {
    this.$update('pxPerBeat', pxPerStep * this.stepsPerBeat);
  }

  public setRowHeight(rowHeight: number) {
    this.$update('rowHeight', rowHeight);
  }

  public mounted() {
    this.horizontalScroller = this.$refs.scroller.$el;
    this.verticalScroller = this.$refs.scrollY.$el;
  }

  @Watch<Sequencer>('loopEnd', { immediate: true })
  public onLoopEndChange() {
    this.$log.debug(`${this.name} -> loodEnd being set to ${this.loopEnd}`);
    this.transport.loopEnd = toTickTime(this.loopEnd);
    this.$update('end', this.loopEnd);
  }

  @Watch<Sequencer>('loopStart', { immediate: true })
  public onLoopStartChange() {
    this.$log.debug(`loopStart being set to ${this.loopStart}`);
    const time = toTickTime(this.loopStart);
    this.transport.loopStart = time;
    this.$update('start', this.loopStart);
  }

  @Watch<Sequencer>('setLoopStart')
  public changeLoopStart() {
    this.loopStart = this.setLoopStart || 0;
  }

  @Watch<Sequencer>('setLoopEnd')
  public changeLoopEnd() {
    if (this.setLoopEnd) {
      this.loopEnd = this.setLoopEnd;
    } else {
      this.loopEnd = this.sequencerLoopEnd;
    }
  }

  @Watch<Sequencer>('sequencerLoopEnd', { immediate: true })
  public changeSeqLoopEnd() {
    if (!this.setLoopEnd) {
      this.loopEnd = this.sequencerLoopEnd;
    }
  }

  @Watch<Sequencer>('transport')
  public resetLoop() {
    this.setLoopStart = null;
    this.setLoopEnd = null;
  }

  @Watch<Sequencer>('play', { immediate: true })
  public onPlay() {
    this.$log.debug(`play -> ${this.play}`);
    if (this.play) {
      this.update();
    } else if (this.transport.state === 'started') {
      // This may not be the best way
      // since we are mutating state directly...
      this.transport.stop();
    }
  }
}
</script>

<style lang="sass" scoped>
.sequencer
  display: block

.timeline
  width: 100%

.timeline, .empty-block
  height: 20px

.side-wrapper
  height: fit-content
</style>