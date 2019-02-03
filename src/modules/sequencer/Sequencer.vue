<template>
  <div class="sequencer">
    <div style="display: flex">
      <div class="empty-block secondary" :style="style"></div>
      <timeline 
        v-model="progress" 
        class="timeline"
        :set-loop-end.sync="setLoopEnd"
        :set-loop-start.sync="setLoopStart"
        :loop-start="loopStart"
        :loop-end="loopEnd"
        :offset="offset"
      ></timeline>
    </div>
    <vue-perfect-scrollbar 
      style="overflow-y: scroll; display: flex; height: calc(100% - 20px)"
      :settings="{ handlers: ['wheel'] }"
    >
      <!-- Use a wrapper div to add width attribute -->
      <div :style="style" class="side-wrapper">
        <slot name="side"></slot>
      </div>
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
          :progress="progress"
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
import { Element } from '@/schemas';
import Part from '@/modules/audio/part';
import { toTickTime } from '@/utils';
import Arranger from '@/modules/sequencer/Arranger.vue';
import Timeline from '@/modules/sequencer/Timeline.vue';

@Component({
  components: { Arranger, Timeline },
})
export default class Sequencer extends Vue {
  @Inject() public pxPerBeat!: number;

  // TODO(jacob) Rename width to something else
  @Prop({ type: Number, default: 80 }) public width!: number;
  @Prop({ type: Array, required: true }) public elements!: Element[];
  @Prop({ type: Boolean, default: false }) public play!: boolean;
  @Prop({ type: Object, required: true }) public part!: Part<Element>;

  public loopStart = 0;
  public loopEnd = 0;
  public scrollLeft = 0;
  public progress = 0;
  public sequencerLoopEnd = 0;
  public setLoopStart: null | number = null;
  public setLoopEnd: null | number = null;

  // Horizontal offset in beats.
  get offset() {
    return this.scrollLeft / this.pxPerBeat;
  }

  get style() {
    return {
      minWidth: `${this.width}px`,
    };
  }

  public added(element: Element) {
    const time = toTickTime(element.time);
    this.$log.debug(`Adding element at ${element.time} -> ${time}`);
    this.part.add(element.callback(), time, element);
  }

  public removed(element: Element) {
    this.part.remove(element);
  }

  public update() {
    if (this.part.state === 'started') { requestAnimationFrame(this.update); }
    this.progress = this.part.progress;
  }

  public scroll(e: UIEvent) {
    // This only handles horizontal scrolls!
    const scroller = this.$refs.scroller as Vue;
    // this.$emit('scroll-horizontal', scroller.$el.scrollLeft);
    this.scrollLeft = scroller.$el.scrollLeft;
  }

  @Watch<Sequencer>('loopEnd', { immediate: true })
  public onLoopEndChange() {
    this.$log.debug(`loodEnd being set to ${this.loopEnd}`);
    this.part.loopEnd = toTickTime(this.loopEnd);
  }

  @Watch<Sequencer>('loopStart', { immediate: true })
  public onLoopStartChange() {
    this.$log.debug(`loopStart being set to ${this.loopStart}`);
    const time = toTickTime(this.loopStart);
    this.part.seconds = new Tone.Time(time).toSeconds();
    this.part.loopStart = time;
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

  @Watch<Sequencer>('part')
  public resetLoop() {
    this.setLoopStart = null;
    this.setLoopEnd = null;
  }

  @Watch<Sequencer>('play', { immediate: true })
  public onPlay() {
    this.$log.debug(`play -> ${this.play}`);
    if (this.play) {
      this.update();
    } else if (this.part.state === 'started') {
      // This may not be the best way
      // since we are mutating state directly...
      this.part.stop();
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