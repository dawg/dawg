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
          :set-loop-end.sync="userLoopEnd"
          :set-loop-start.sync="userLoopStart"
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
        ref="scrollX"
        style="height: fit-content"
        :settings="{ suppressScrollY: true, handlers: ['wheel'] }"
      >
        <sequencer-grid
          @added="added"
          @removed="removed"
          :elements="elements"
          :sequencer-loop-end.sync="sequencerLoopEnd"
          :loop-start="loopStart"
          :loop-end="loopEnd"
          :set-loop-start="userLoopStart"
          :set-loop-end="userLoopEnd"
          :steps-per-beat="stepsPerBeat"
          :beats-per-measure="beatsPerMeasure"
          :px-per-beat="pxPerBeat"
          :row-height="rowHeight"
          :progress="progress"
          :name="name"
          :display-loop-end.sync="displayLoopEnd"
          v-bind="$attrs"
          v-on="$listeners"
        ></sequencer-grid>
      </vue-perfect-scrollbar>

    </vue-perfect-scrollbar>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import Tone from 'tone';
import { Watch } from '@/modules/update';
import { Schedulable } from '@/core';
import Transport from '@/modules/audio/transport';
import { toTickTime, clamp } from '@/utils';
import SequencerGrid from '@/modules/sequencer/SequencerGrid.vue';
import Timeline from '@/modules/sequencer/Timeline.vue';

@Component({
  components: { SequencerGrid, Timeline },
})
export default class Sequencer extends Vue {
  @Prop({ type: Number, required: true }) public stepsPerBeat!: number;
  @Prop({ type: Number, required: true }) public beatsPerMeasure!: number;
  @Prop({ type: Number, required: true }) public rowHeight!: number;
  @Prop({ type: Number, required: true }) public pxPerBeat!: number;

  @Prop({ type: String, required: true }) public name!: string;
  @Prop({ type: Number, default: 80 }) public sideWidth!: number;
  @Prop({ type: Array, required: true }) public elements!: Schedulable[];
  @Prop({ type: Boolean, default: false }) public play!: boolean;
  @Prop({ type: Object, required: true }) public transport!: Transport;
  @Prop({ type: Boolean, default: false }) public isRecording!: boolean;

  /**
   * Set this if you want to control the end of the loop. This will be ignored if set to 0.
   */
  @Prop({ type: Number, required: false }) public setLoopEnd!: number;

  /**
   * This will be synced with the end of the end of the loop.
   */
  @Prop(Number) public end!: number;

  /**
   * This will be synced with the start of the loop.
   */
  @Prop(Number) public start!: number;

  public scrollLeft = 0;
  public progress = 0;
  public sequencerLoopEnd = 0;
  public displayLoopEnd = 0;

  // The loop start/end set by the user using the timeline.
  public userLoopStart: null | number = null;
  public userLoopEnd: null | number = null;

  public verticalScroller: Element | null = null;
  public horizontalScroller: Element | null = null;

  public $refs!: {
    scrollX: Vue;
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

  get loopEnd() {
    // Prioritize the loop end set by the user
    // Then check if a specific loop end has been given
    // Then fallback to the calculated loop end

    if (this.userLoopEnd) {
      return this.userLoopEnd;
    }

    if (this.isRecording) {
      console.log('update loop end', this.displayLoopEnd);
      return this.displayLoopEnd;
    }

    if (this.setLoopEnd) {
      return this.setLoopEnd;
    }


    return this.sequencerLoopEnd;
  }

  get loopStart() {
    return this.userLoopStart || 0;
  }

  public seek(beat: number) {
    const time = toTickTime(beat);
    this.transport.seconds = new Tone.Time(time).toSeconds();
    this.update();
  }

  public added(element: Schedulable) {
    this.$log.debug(`Adding element at ${element.time}`);
    element.schedule(this.transport);
    this.$emit('added', element);
  }

  public removed(element: Schedulable) {
    this.$log.debug(`Removing element at ${element.time}`);
    element.remove(this.transport);
    this.$emit('removed', element);
  }

  public update() {
    if (this.transport.state === 'started') { requestAnimationFrame(this.update); }
    this.progress = this.transport.progress;
  }

  public scroll() {
    // This only handles horizontal scrolls!
    this.scrollLeft = this.$refs.scrollX.$el.scrollLeft;
  }

  public setPxPerBeat(pxPerStep: number) {
    this.$update('pxPerBeat', pxPerStep * this.stepsPerBeat);
  }

  public setRowHeight(rowHeight: number) {
    this.$update('rowHeight', rowHeight);
  }

  public mounted() {
    this.horizontalScroller = this.$refs.scrollX.$el;
    this.verticalScroller = this.$refs.scrollY.$el;
  }

  @Watch<Sequencer>('loopEnd', { immediate: true })
  public onLoopEndChange() {
    this.$log.debug(`${this.name} -> loodEnd being set to ${this.loopEnd}`);
    const time = toTickTime(this.loopEnd);
    this.transport.loopEnd = new Tone.TransportTime(time).toSeconds();
    this.$update('end', this.loopEnd);
  }

  @Watch<Sequencer>('loopStart', { immediate: true })
  public onLoopStartChange() {
    this.$log.debug(`loopStart being set to ${this.loopStart}`);
    const time = toTickTime(this.loopStart);
    this.transport.loopStart = new Tone.TransportTime(time).toSeconds();
    this.$update('start', this.loopStart);
  }

  @Watch<Sequencer>('transport')
  public resetLoop() {
    this.userLoopStart = null;
    this.userLoopEnd = null;
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