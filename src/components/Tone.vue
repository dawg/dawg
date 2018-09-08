<template>
  <button @click="click" style="padding: 5px; border: solid 1px;">{{ text }}</button>
</template>

<script>
import Tone from 'tone';

export default {
  name: 'Tone',
  data: () => ({ playing: false, text: 'PLAY' }),
  methods: {
    click() {
      if (this.playing) {
        Tone.Transport.stop();
        this.text = 'PLAY';
      } else {
        Tone.Transport.start('+0.1');
        this.text = 'STOP';
      }
      this.playing = !this.playing;
    },
  },
  mounted() {
    // const kick = new Tone.MembraneSynth({
    //   'envelope': {
    //     'sustain': 0,
    //     'attack': 0.02,
    //     'decay': 0.8
    //   },
    //   'octaves': 10
    // }).toMaster()
    // new Tone.Loop(time => {
    //   kick.triggerAttackRelease('C2', '8n', time)
    // }, '2n').start(0)

    const piano = new Tone.Synth().toMaster();
    const cChord = 'C4';
    const dChord = 'D4';
    const gChord = 'B3';
    const pianoPart = new Tone.Part((time, chord) => {
      console.log(time);
      piano.triggerAttackRelease(chord, '8n', time);
    }, [['0:0:2', cChord], ['0:1', cChord], ['0:1:3', dChord], ['0:2:2', cChord], ['0:3', cChord], ['0:3:2', gChord]]).start(0);
    pianoPart.loop = true;
    pianoPart.loopEnd = '1m';
    pianoPart.humanize = true;

    // const bass = new Tone.MonoSynth({
    //   'volume': -10,
    //   'envelope': {
    //     'attack': 0.1,
    //     'decay': 0.3,
    //     'release': 2
    //   },
    //   'filterEnvelope': {
    //     'attack': 0.001,
    //     'decay': 0.01,
    //     'sustain': 0.5,
    //     'baseFrequency': 200,
    //     'octaves': 2.6
    //   }
    // }).toMaster()
    // const bassPart = new Tone.Sequence((time, note) => {
    //   bass.triggerAttackRelease(note, '16n', time)
    // }, ['C2', ['C3', ['C3', 'D2']], 'E2', ['D2', 'A1']]).start(0)
    // bassPart.probability = 0.9

    // set the transport
    Tone.Transport.bpm.value = 90;
  },
};
</script>

<style scoped>

</style>
