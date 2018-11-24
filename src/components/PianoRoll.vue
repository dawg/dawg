<template>
  <div 
    class="piano-roll"
    v-shortkey="['space']"
    @shortkey="playPause"
  >
    <div class="pianos">
      <piano
        v-for="octave in octaves"
        :key="octave"
        :octave="octave"
      ></piano>
    </div>
    <sequencer
      :note-width="noteWidth" 
      :note-height="noteHeight" 
      :measures="1"
      v-model="notes"
      @added="added"
      @removed="removed"
    ></sequencer>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import Tone from 'tone';
import Piano from '@/components/Piano.vue';
import Sequencer from '@/components/Sequencer.vue';
import { NoteInfo } from '@/types';

const piano = new Tone.PolySynth(8, Tone.Synth).toMaster();



@Component({components: { Piano, Sequencer }})
export default class PianoRoll extends Vue {
  public noteWidth = 20;
  public noteHeight = 16;
  public notes = [];
  public octaves = [5, 4];
  public measures = 1;
  public part = new Tone.Part(this.callback)
  public mounted() {
    this.part.start(0);
    this.part.loop = true;
    this.part.humanize = true;
    Tone.Transport.bpm.value = 93;
  }
  public playPause() {
    if(Tone.Transport.state === 'started') {
      this.pause();
    } else {
      this.play();
    }
  }
  public play() {
    Tone.Transport.start();
  }
  public pause() {
    Tone.Transport.pause();
  }
  public stop() {
    Tone.Transport.stop();
  }
  public added(note: NoteInfo) {
    this.part.add(note.time, note);
  }
  public removed(note: NoteInfo) {
    this.part.remove(note.time, note);
  }
  public callback(time: string, note: NoteInfo) {
    // console.log(`PR: ${note.length}`)
    let rem = note.length;
    const sixteenths = rem % 4; rem = Math.floor(rem / 4);
    const quarters = rem % 4; const bars = Math.floor(rem / 4);
    piano.triggerAttackRelease(note.value, `${bars}:${quarters}:${sixteenths}`, time);
  }
  @Watch('measures', { immediate: true })
  public onMeasuresChange() {
    this.part.loopEnd = `${this.measures}m`;
  }
}
</script>

<style lang="sass" scoped>
.piano-roll
  display: flex
  border-top: 1px solid #111
  height: 100%
  overflow-y: scroll

.pianos
  display: flex
  flex-direction: column
</style>