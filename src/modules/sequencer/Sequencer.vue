<template>
  <div class="flex flex-col">
    <div class="flex" style="flex: 0 0 25px">
      <div class="bg-default h-full flex justify-end items-center border-r border-default-darken-1" :style="style">
        <div 
          class="cursor-pointer pr-2 text-sm text-default-darken-3 tracking-tight"
          @click="cycleSnap"
          title="Measured in steps"
        >
          {{ snap.display }}
        </div>
        <dg-fa-icon
          class="cursor-pointer mr-2 text-default-darken-3 text-sm"
          icon="magnet"
          @click="cycleSnap"
          title="Measured in steps"
        ></dg-fa-icon>
      </div>
      <scroller
        :scroller="horizontalScroller"
        class="w-full h-full"
        :increment="pxPerStep"
        direction="horizontal"
        @update:increment="setPxPerBeat"
        @scroll="scroll"
      >
        <timeline 
          v-model="progress" 
          class="w-full h-full"
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
    <div
      class="flex scroller overflow-y-scroll"
      ref="scrollY"
    >
      <!-- Use a wrapper div to add width attribute -->
      <scroller 
        :style="style" 
        class="side-wrapper border-r border-default-darken-1"
        direction="vertical"
        :scroller="verticalScroller"
        :increment="rowHeight"
        @update:increment="setRowHeight"
      >
        <slot 
          name="side"
        ></slot>
      </scroller>
      <sequencer-grid
        class="sequencer scroller overflow-x-scroll" 
        @scroll.native="scroll"
        ref="scrollX"
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
        :snap="snap.value"
        :min-snap="minSnap"
        :display-loop-end.sync="displayLoopEnd"
        v-bind="$attrs"
        v-on="$listeners"
      ></sequencer-grid>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import { Watch } from '@/modules/update';
import { Schedulable } from '@/core';
import { Transport } from '@/modules/audio/transport';
import { clamp } from '@/utils';
import SequencerGrid from '@/modules/sequencer/SequencerGrid.vue';
import Timeline from '@/modules/sequencer/Timeline.vue';
import { Context } from '../audio/context';

// TODO
// 1. Convert to composition API
// 2. Add offset
// 3. Remove "curse" thing from drag

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
  public selectedSnap = 0;

  public $refs!: {
    scrollX: Vue;
    scrollY: Element;
  };

  get minSnap() {
    return 1 / this.stepsPerBeat / 24;
  }

  get snaps() {
    return [
      { display: '1', value: 1 / this.stepsPerBeat },
      { display: '1/2', value: 1 / this.stepsPerBeat / 2 },
      { display: '1/4', value: 1 / this.stepsPerBeat / 4 },
      { display: '1/6', value: 1 / this.stepsPerBeat / 6 },
      { display: 'None', value: this.minSnap },
    ];
  }

  get snap() {
    return this.snaps[this.selectedSnap];
  }

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

  public cycleSnap() {
    this.selectedSnap = (this.selectedSnap + 1) % this.snaps.length;
  }

  public seek(beat: number) {
    this.transport.beat = beat;
    this.update();
  }

  public update() {
    if (this.transport.state === 'started') { requestAnimationFrame(this.update); }
    this.progress = this.transport.getProgress();
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
    this.verticalScroller = this.$refs.scrollY;
  }

  @Watch<Sequencer>('loopEnd', { immediate: true })
  public onLoopEndChange() {
    this.transport.loopEnd = this.loopEnd;
    this.$update('end', this.loopEnd);
  }

  @Watch<Sequencer>('loopStart', { immediate: true })
  public onLoopStartChange() {
    this.transport.loopStart = this.loopStart;
    this.$update('start', this.loopStart);
  }

  @Watch<Sequencer>('transport')
  public resetLoop() {
    this.userLoopStart = null;
    this.userLoopEnd = null;
  }

  @Watch<Sequencer>('play', { immediate: true })
  public onPlay() {
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

<style lang="scss" scoped>
.side-wrapper {
  height: fit-content
}

.scroller::-webkit-scrollbar {
  display: none;
}
</style>