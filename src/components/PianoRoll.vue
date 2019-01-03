<template>
  <!-- <div
    v-shortkey="['space']"
    @shortkey="playPause"
  ></div> -->
  <div class="piano-roll">
    <div style="display: flex">
      <div class="empty-block secondary"></div>
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
    <div style="overflow-y: scroll; display: flex; height: calc(100% - 20px)">
      <piano :synth="synth"></piano>
      <sequencer
        style="width: calc(100% - 80px)"
        @added="added"
        @removed="removed"
        @scroll-horizontal="scrollHorizontal"
        @loop-end="sequencerLoopEnd = $event"
        :loop-start="loopStart"
        :loop-end="loopEnd"
        :set-loop-start="setLoopStart"
        :set-loop-end="setLoopEnd"
        :progress="progress"
      ></sequencer>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import Tone from 'tone';
import Piano from '@/components/Piano.vue';
import Sequencer from '@/components/Sequencer.vue';
import Timeline from '@/components/Timeline.vue';
import { Note } from '@/models';
import { toTickTime } from '@/utils';
import { Transform } from 'stream';
import { Watch } from '@/modules/update';

@Component({components: { Piano, Sequencer, Timeline }})
export default class PianoRoll extends Vue {
  @Inject() public pxPerBeat!: number;
  @Prop({ type: Object, required: false }) public synth?: Tone.Synth;
  @Prop({ type: Array, required: true }) public value!: Note[];
  @Prop({ type: Number, required: true }) public loopStart!: number;
  @Prop({ type: Number, required: true }) public loopEnd!: number;
  @Prop({ type: Boolean, required: true }) public play!: boolean;

  public scrollLeft = 0;
  public progress = 0;
  public sequencerLoopEnd = 0;
  public setLoopStart: null | number = null;
  public setLoopEnd: null | number = null;

  @Watch<PianoRoll>('setLoopStart')
  public changeLoopStart() {
    this.$update('loopStart', this.setLoopStart || 0);
  }

  @Watch<PianoRoll>('setLoopEnd')
  public changeLoopEnd() {
    if (this.setLoopEnd) {
      this.$update('loopEnd', this.setLoopEnd);
    } else {
      this.$update('loopEnd', this.sequencerLoopEnd);
    }
  }

  @Watch<PianoRoll>('sequencerLoopEnd', { immediate: true })
  public changeSeqLoopEnd() {
    if (!this.setLoopEnd) {
      this.$update('loopEnd', this.sequencerLoopEnd);
    }
  }

  public update() {
    if (Tone.Transport.state === 'started') { requestAnimationFrame(this.update); }
    this.progress = Tone.Transport.progress;
  }

  @Watch<PianoRoll>('play', { immediate: true })
  public onPlay() {
    if (this.play) {
      this.update();
    }
  }
  public added(note: Note) {
    this.$emit('added', note);
  }
  public removed(note: Note, i: number) {
    this.$emit('removed', note, i);
  }
  @Watch<PianoRoll>('loopEnd', { immediate: true })
  public onLoopEndChange() {
    this.$log.debug(`loodEnd being set to ${this.loopEnd}`);
    Tone.Transport.loopEnd = toTickTime(this.loopEnd);
  }
  @Watch<PianoRoll>('loopStart', { immediate: true })
  public onLoopStartChange() {
    this.$log.debug(`loopStart being set to ${this.loopStart}`);
    const time = toTickTime(this.loopStart);
    Tone.Transport.seconds = new Tone.Time(time).toSeconds();
    Tone.Transport.loopStart = time;
  }
  public scrollHorizontal(scrollLeft: number) {
    this.scrollLeft = scrollLeft;
  }
  public get offset() {
    return this.scrollLeft / this.pxPerBeat;
  }
}
</script>

<style lang="sass" scoped>
.piano-roll
  border-top: 1px solid #111
  height: 100%

.timeline, .empty-block
  height: 20px

.timeline
  width: calc(100% - 80px)

.empty-block
  width: 80px
</style>