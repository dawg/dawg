<template>
  <div 
    class="piano-roll"
    v-shortkey="['space']"
    @shortkey="playPause"
  >
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
import { allKeys, toTickTime } from '@/utils';
import { Transform } from 'stream';
import { Watch } from '@/modules/update';

@Component({components: { Piano, Sequencer, Timeline }})
export default class PianoRoll extends Vue {
  @Inject() public pxPerBeat!: number;
  @Prop({ type: Object, required: false }) public synth?: Tone.Synth;
  @Prop({ type: Array, required: true }) public value!: Note[];

  public scrollLeft = 0;
  public progress = 0;
  public part = new Tone.Part(this.callback);
  public sequencerLoopEnd = 0;
  public setLoopStart: null | number = null;
  public setLoopEnd: null | number = null;

  public mounted() {
    this.part.start(0);
    Tone.Transport.loop = true;
    this.part.humanize = true;
    Tone.Transport.bpm.value = 93;
  }
  public get loopStart() {
    return this.setLoopStart || 0;
  }
  public get loopEnd() {
    return this.setLoopEnd || this.sequencerLoopEnd;
  }
  public playPause() {
    if (Tone.Transport.state === 'started') {
      this.pause();
    } else {
      this.play();
    }
  }
  public update() {
    if (Tone.Transport.state === 'started') { requestAnimationFrame(this.update); }
    this.progress = Tone.Transport.progress;
  }
  public play() {
    Tone.Transport.start();
    this.update();
  }
  public pause() {
    Tone.Transport.pause();
  }
  public stop() {
    Tone.Transport.stop();
  }
  public added(note: Note) {
    const time = toTickTime(note.time);
    this.$log.info(`Adding note at ${note.time} -> ${time}`);
    this.part.add(time, note);
    this.value.push(note);
  }
  public removed(note: Note, i: number) {
    const time = toTickTime(note.time);
    this.part.remove(time, note);
    this.$delete(this.value, i);
  }
  public callback(time: string, note: Note) {
    if (!this.synth) { return; }
    const duration = toTickTime(note.duration);
    const value = allKeys[note.id].value;
    this.synth.triggerAttackRelease(value, duration, time);
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