import Vue from 'vue';
import { storiesOf } from '@storybook/vue';
import { action } from '@storybook/addon-actions';
import Dawg from '@/components/Dawg.vue';
import SequencerRow from '@/modules/sequencer/SequencerRow.vue';
import Sequencer from '@/modules/sequencer/Sequencer.vue';
import TestItem from '@/modules/sequencer/TestItem.vue';
import Waveform from '@/modules/sequencer/Waveform.vue';
import Sample from '@/modules/sequencer/Sample.vue';
import BeatLines from '@/modules/sequencer/BeatLines';
import { allKeys } from '@/utils';
import TestClass from '@/modules/sequencer/TestClass';
import { loadFromUrl } from '../audio/web';

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

Vue.component('TestItem', TestItem);

storiesOf(Sequencer.name, module)
  .add('Standard', () => ({
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
      notes: [],
      measures: 1,
      sequencerLoopEnd: 0,
      loopStart: 0,
      loopEnd: 0,
      setLoopStart: 0,
      setLoopEnd: 0,
      progress: 0,
      classes: 'TestItem',
      createClass: TestClass,
    }),
    components: { Sequencer, Dawg },
    methods: { rowClass },
  }));

storiesOf(SequencerRow.name, module)
  .add('Standard', () => ({
    template: `
    <dawg>
      <sequencer-row
        v-for="i in 20"
        :key="i"
        :row="40 + i"
        :total-beats="12"
        :class="rowClass(i)"
        @click="click"
      ></sequencer-row>
    </dawg>
    `,
    components: { SequencerRow, Dawg },
    methods: {
      click: action('clicked'),
      rowClass,
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
    template: `<waveform :buffer="buffer"></waveform>`,
    components: { Waveform },
    data: () => ({ buffer: null }),
    mounted,
  }));

storiesOf('Sample', module)
  .add('default', () => ({
    template: `<sample :buffer="buffer"></sample>`,
    components: { Sample },
    data: () => ({ buffer: null }),
    mounted,
  }));
