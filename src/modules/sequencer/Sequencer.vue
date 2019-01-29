<template>
  <div class="sequencer">
    <timeline 
      v-model="progress" 
      class="timeline"
      :set-loop-end.sync="setLoopEnd"
      :set-loop-start.sync="setLoopStart"
      :loop-start="loopStart"
      :loop-end="loopEnd"
      :offset="offset"
    ></timeline>
    <arranger
      @added="added"
      @removed="removed"
      @scroll-horizontal="scrollHorizontal"
      :elements="elements"
      :sequencer-loop-end.sync="sequencerLoopEnd"
      :loop-start="loopStart"
      :loop-end="loopEnd"
      :set-loop-start="setLoopStart"
      :set-loop-end="setLoopEnd"
      :progress="progress"
      v-bind="$attrs"
    ></arranger>
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

  @Prop({ type: Array, required: true }) public elements!: Element[];
  @Prop({ type: Boolean, required: true }) public play!: boolean;
  @Prop({ type: Object, required: true }) public part!: Part<Element>;

  public loopStart = 0;
  public loopEnd = 0;
  public scrollLeft = 0;
  public progress = 0;
  public sequencerLoopEnd = 0;
  public setLoopStart: null | number = null;
  public setLoopEnd: null | number = null;

  // Horizontal offset in beats.
  public get offset() {
    return this.scrollLeft / this.pxPerBeat;
  }

  public scrollHorizontal(scrollLeft: number) {
    this.scrollLeft = scrollLeft;
  }

  public update() {
    if (this.part.state === 'started') { requestAnimationFrame(this.update); }
    this.progress = this.part.progress;
  }

  public added(note: Element) {
    // TODO There is duplication here with project.ts
    // Eventually, we will need a solution.
    const time = toTickTime(note.time);
    this.$log.debug(`Adding note at ${note.time} -> ${time}`);

    // TODO(jacob) FIX
    // const callback = this.instrument.callback.bind(this.instrument);
    const callback = () => {
      // tslint:disable-next-line:no-console
      console.log(note.time, note.row);
    };

    this.part.add(callback, time, note);
  }

  public removed(note: Element, i: number) {
    this.part.remove(note);
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
    if (this.play) {
      this.update();
    }
  }
}
</script>

<style lang="sass" scoped>
.sequencer
  display: block
  border-top: 1px solid #111
  height: 100%

.timeline
  width: 100%
  height: 20px
</style>