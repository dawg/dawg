<template>
  <div 
    class="piano-roll"
    v-shortkey="['space']"
    @shortkey="playPause"
  >
    <div style="display: flex">
      <!-- TODO Just offset the timeline and remove this block + wrapper -->
      <div class="empty-block"></div>
      <!-- TODO loop-start and loop-end need to be refactored -->
      <timeline 
        v-model="time" 
        class="timeline" 
        :loop-start="0"
        :loop-end="8"
        :offset="offset"
      ></timeline>
    </div>
    <div style="overflow-y: scroll; display: flex; height: calc(100% - 20px)">
      <div class="pianos">
        <piano
          v-for="octave in octaves"
          :key="octave"
          :synth="synth"
          :octave="octave"
        ></piano>
      </div>
      <sequencer
        style="width: calc(100% - 80px)"
        :note-width="noteWidth" 
        :note-height="noteHeight" 
        :measures.sync="measures"
        :octaves="octaves"
        :value="notes"
        @added="added"
        @removed="removed"
        @scroll-horizontal="scrollHorizontal"
      ></sequencer>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import Tone from 'tone';
import Piano from '@/components/Piano.vue';
import Sequencer from '@/components/Sequencer.vue';
import Timeline from '@/components/Timeline.vue';
import { NoteInfo } from '@/types';
import pop from '@/assets/popPop';

// TODO PolySynth for Synth components
// const piano = new Tone.PolySynth(8, Tone.Synth).toMaster();


@Component({components: { Piano, Sequencer, Timeline }})
export default class PianoRoll extends Vue {
  @Prop({ type: Object, required: false }) public synth?: Tone.Synth;

  public noteWidth = 20;
  public pxPerBeat = 80;
  public scrollLeft = 0;
  public noteHeight = 16;
  public notes = pop;
  public octaves = [6, 5, 4, 3];
  public time = 0;
  public max = 8;
  public measures = 4;
  public part = new Tone.Part(this.callback);
  public mounted() {
    this.part.start(0);
    this.part.loop = true;
    this.part.humanize = true;
    Tone.Transport.bpm.value = 93;
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
    this.time = this.part.progress;
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
  public added(note: NoteInfo) {
    const time = `${note.time * Tone.Transport.PPQ}i`;
    this.part.add(note.time, note);
  }
  public removed(note: NoteInfo) {
    const time = `${note.time * Tone.Transport.PPQ}i`;
    this.part.remove(note.time, note);
  }
  public callback(time: string, note: NoteInfo) {
    if (!this.synth) { return; }

    let rem = note.length;
    const sixteenths = rem % 4; rem = Math.floor(rem / 4);
    const quarters = rem % 4; const bars = Math.floor(rem / 4);

    this.synth.triggerAttackRelease(note.value, `${bars}:${quarters}:${sixteenths}`, time);
  }
  @Watch('measures', { immediate: true })
  public onMeasuresChange() {
    // TODO differentiate between visiable + last measure that a note exists
    this.part.loopEnd = '2m'; // `${this.measures}m`;
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

.pianos
  display: flex
  flex-direction: column
</style>