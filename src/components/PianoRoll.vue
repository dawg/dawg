<template>
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
        v-model="value"
        @added="added"
        @removed="removed"
        @scroll-horizontal="scrollHorizontal"
        :sequencer-loop-end.sync="sequencerLoopEnd"
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
import { Note, Instrument } from '@/schemas';
import { toTickTime, allKeys } from '@/utils';
import { Transform } from 'stream';
import { Watch } from '@/modules/update';
import Part from '@/modules/audio/part';

@Component({components: { Piano, Sequencer, Timeline }})
export default class PianoRoll extends Vue {
  @Inject() public pxPerBeat!: number;
  @Prop({ type: Object, required: true }) public instrument!: Instrument;
  @Prop({ type: Array, required: true }) public value!: Note[];
  @Prop({ type: Boolean, required: true }) public play!: boolean;
  @Prop({ type: Object, required: true }) public part!: Part<Note>;

  public loopStart = 0;
  public loopEnd = 0;
  public scrollLeft = 0;
  public progress = 0;
  public sequencerLoopEnd = 0;
  public setLoopStart: null | number = null;
  public setLoopEnd: null | number = null;

  public update() {
    if (this.part.state === 'started') { requestAnimationFrame(this.update); }
    this.progress = this.part.progress;
  }

  public added(note: Note) {
    const time = toTickTime(note.time);
    this.$log.debug(`Adding note at ${note.time} -> ${time}`);
    this.part.add(this.callback(this.instrument), time, note);
  }
  public removed(note: Note, i: number) {
    // const time = toTickTime(note.time);
    this.part.remove(note);
  }

  /**
   * The callback for the part. The instrument is given so that it is stored within the callback.
   */
  public callback(instrument: Instrument) {
    return (time: number, note: Note) => {
      const duration = toTickTime(note.duration);
      const value = allKeys[note.id].value;
      instrument.triggerAttackRelease(value, duration, time);
    };
  }

  public scrollHorizontal(scrollLeft: number) {
    this.scrollLeft = scrollLeft;
  }

  public get offset() {
    return this.scrollLeft / this.pxPerBeat;
  }

  @Watch<PianoRoll>('part')
  public resetLoop() {
    this.setLoopStart = null;
    this.setLoopEnd = null;
  }

  @Watch<PianoRoll>('setLoopStart')
  public changeLoopStart() {
    this.loopStart = this.setLoopStart || 0;
  }

  @Watch<PianoRoll>('setLoopEnd')
  public changeLoopEnd() {
    if (this.setLoopEnd) {
      this.loopEnd = this.setLoopEnd;
    } else {
      this.loopEnd = this.sequencerLoopEnd;
    }
  }

  @Watch<PianoRoll>('sequencerLoopEnd', { immediate: true })
  public changeSeqLoopEnd() {
    if (!this.setLoopEnd) {
      this.loopEnd = this.sequencerLoopEnd;
    }
  }

  @Watch<PianoRoll>('play', { immediate: true })
  public onPlay() {
    if (this.play) {
      this.update();
    }
  }

  @Watch<PianoRoll>('loopEnd', { immediate: true })
  public onLoopEndChange() {
    this.$log.debug(`loodEnd being set to ${this.loopEnd}`);
    this.part.loopEnd = toTickTime(this.loopEnd);
  }

  @Watch<PianoRoll>('loopStart', { immediate: true })
  public onLoopStartChange() {
    this.$log.debug(`loopStart being set to ${this.loopStart}`);
    const time = toTickTime(this.loopStart);
    this.part.seconds = new Tone.Time(time).toSeconds();
    this.part.loopStart = time;
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