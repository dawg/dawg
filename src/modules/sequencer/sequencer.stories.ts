import Vue from 'vue';
import { storiesOf } from '@storybook/vue';
import Dawg from '@/modules/dawg/Dawg.vue';
import Sequencer from '@/modules/sequencer/Sequencer.vue';
import Note from '@/modules/sequencer/Note.vue';
import Waveform from '@/modules/sequencer/Waveform.vue';
import Sample from '@/modules/sequencer/Sample.vue';
import Pattern from '@/modules/sequencer/Pattern.vue';
import BeatLines from '@/modules/sequencer/BeatLines';
import { allKeys } from '@/utils';
import TestClass from '@/modules/sequencer/TestClass';
import { loadFromUrl } from '@/modules/audio/web';

function rowClass(i: number) {
  const key = allKeys[i].value;
  return key.includes('#') ? 'secondary-darken-1' : 'secondary';
}

const Temp = Vue.extend({
  template: `<div style="height: 30px; width: 400px"></div>`,
  mixins: [BeatLines],
});

storiesOf(BeatLines.name, module)
  .add('Standard', () => ({
    template: `
    <dawg>
      <temp></temp>
    </dawg>
    `,
    components: { Temp, Dawg },
  }));

Vue.component('Note', Note);

const basicData = {
  notes: [],
  measures: 1,
  sequencerLoopEnd: 0,
  loopStart: 0,
  loopEnd: 0,
  setLoopStart: 0,
  setLoopEnd: 0,
  progress: 0,
};

storiesOf(Sequencer.name, module)
  .add('piano roll', () => ({
    template: `
    <dawg>
      <sequencer
        v-model="notes"
        :sequencer-loop-end.sync="sequencerLoopEnd"
        :loop-start="loopStart"
        :loop-end="loopEnd"
        :set-loop-start="setLoopStart"
        :set-loop-end="setLoopEnd"
        :progress="progress"
        :num-rows="88"
        :classes="classes"
        :createClass="createClass"
        :row-class="rowClass"
      ></sequencer>
    </dawg>
    `,
    data: () => ({
      ...basicData,
      classes: 'Note',
      createClass: TestClass,
    }),
    components: { Sequencer, Dawg },
    methods: { rowClass },
  }))
  .add('playlist', () => ({
    template: `
    <dawg>
      <sequencer
        v-model="notes"
        :sequencer-loop-end.sync="sequencerLoopEnd"
        :loop-start="loopStart"
        :loop-end="loopEnd"
        :set-loop-start="setLoopStart"
        :set-loop-end="setLoopEnd"
        :progress="progress"
        :num-rows="20"
        :classes="classes"
        :createClass="createClass"
        :row-class="() => 'secondary'"
        :row-style="rowStyle"
      ></sequencer>
    </dawg>
    `,
    data: () => ({
      ...basicData,
      classes: 'Note',
      createClass: TestClass,
    }),
    components: { Sequencer, Dawg },
    methods: {
      rowStyle() {
        return {
          borderBottom: '1px solid black',
        };
      },
    },
  }));

function mounted() {
  loadFromUrl('thing.wav')
    .then((buffer) => {
      // @ts-ignore
      this.buffer = buffer;
    });
}

storiesOf('Waveform', module)
  .add('default', () => ({
    template: `<waveform :buffer="buffer" style="width: 200px"></waveform>`,
    components: { Waveform },
    data: () => ({ buffer: null }),
    mounted,
  }));

storiesOf('Sample', module)
  .add('default', () => ({
    template: `
    <dawg>
      <sample
        :buffer="buffer"
        :duration="1"
      ></sample>
    </dawg>
    `,
    components: { Sample, Dawg },
    data: () => ({ buffer: null }),
    mounted,
  }));

const notes = [
    {id: 44, time: 0, duration: 1},
    {id: 47, time: 0, duration: 1},
    {id: 49, time: 0, duration: 1},
    {id: 47, time: 1, duration: 1},
    {id: 49, time: 1, duration: 1},
    {id: 51, time: 1, duration: 1},
    {id: 52, time: 2, duration: 0.5},
    {id: 51, time: 3, duration: 0.5},
    {id: 45, time: 4, duration: 0.5},
    {id: 48, time: 5, duration: 0.5},
  ];


storiesOf('Pattern', module)
  .add('default', () => ({
    template: `
    <dawg>
      <pattern-item
        :duration="duration"
        :notes="notes"
      ></pattern-item>
    </dawg>`,
    components: { PatternItem: Pattern, Dawg },
    data: () => ({ notes, duration: 0 }),
  }));
