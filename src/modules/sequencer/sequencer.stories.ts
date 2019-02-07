import Vue from 'vue';
import { storiesOf } from '@storybook/vue';
import Dawg from '@/modules/dawg/Dawg.vue';
import PianoRollSequencer from '@/modules/sequencer/PianoRollSequencer.vue';
import PlaylistSequencer from '@/modules/sequencer/PlaylistSequencer.vue';
import Waveform from '@/modules/sequencer/Waveform.vue';
import BeatLines from '@/modules/sequencer/BeatLines';
import { loadFromUrl } from '@/modules/wav/web';
import { PlacedPattern, Pattern, Score, Note as NE, PlacedSample, Instrument, Track, Sample } from '@/schemas';
import { resizable, Note, PatternElement, SampleElement, positionable } from '@/modules/sequencer';
import Transport from '@/modules/audio/transport';
import { range } from '@/utils';

const Temp = Vue.extend({
  template: `<div style="height: 30px; width: 400px"></div>`,
  mixins: [BeatLines],
});

const notes = [
  {row: 44, time: 0, duration: 1},
  {row: 47, time: 0, duration: 1},
  {row: 49, time: 0, duration: 1},
  {row: 47, time: 1, duration: 1},
  {row: 49, time: 1, duration: 1},
  {row: 51, time: 1, duration: 1},
  {row: 52, time: 2, duration: 0.5},
  {row: 51, time: 3, duration: 0.5},
  {row: 45, time: 4, duration: 0.5},
  {row: 48, time: 5, duration: 0.5},
];

storiesOf(BeatLines.name, module)
  .add('Standard', () => ({
    template: `
    <dawg>
      <temp></temp>
    </dawg>
    `,
    components: { Temp, Dawg },
  }));

storiesOf('PianoRollSequencer', module)
  .add('default', () => ({
    template: `
    <dawg>
      <piano-roll-sequencer
        style="height: 500px"
        :elements="notes"
        :transport="transport"
        :instrument="instrument"
      ></piano-roll-sequencer>
    </dawg>
    `,
    data: () => ({
      notes: [],
      transport: new Transport(),
      instrument: Instrument.default('TEST'),
    }),
    components: { PianoRollSequencer, Dawg },
  }));


const pattern = Pattern.create('Test Pattern');
const score = Score.create(Instrument.default('sdklfjsdf'));
pattern.scores = [score];
score.notes = notes.map((note) => new NE(note));
const patternElement = PlacedPattern.create(pattern);

storiesOf('PlaylistSequencer', module)
.add('default', () => ({
  template: `
  <dawg>
    <playlist-sequencer
      style="height: 500px"
      :elements="elements"
      :prototype="element"
      :transport="transport"
      :tracks="tracks"
    ></playlist-sequencer>
  </dawg>
  `,
  data: () => ({
    transport: new Transport(),
    elements: [],
    buffer: null,
    element: patternElement,
    tracks: range(21).map((i) => Track.create(i)),

  }),
  components: { PlaylistSequencer, Dawg },
  mounted,
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

storiesOf('SampleElement', module)
  .add('default', () => ({
    template: `
    <dawg>
      <sample-element
        v-if="element"
        :height="40"
        :element="element"
        :duration.sync="duration"
      ></sample-element>
    </dawg>
    `,
    components: { SampleElement, Dawg },
    data: () => ({ buffer: null, duration: 1 }),
    mounted,
    computed: {
      element() {
        if (!this.buffer) {
          return;
        }

        // @ts-ignore
        const buffer: AudioBuffer = this.buffer;
        const sample = new Sample();
        sample.buffer = buffer;

        return PlacedSample.create(sample);
      },
    },
  }));

storiesOf('PatternElement', module)
  .add('default', () => ({
    template: `
    <dawg>
      <pattern-element
        :duration.sync="duration"
        :height="40"
        :element="element"
      ></pattern-element>
    </dawg>`,
    components: { PatternElement, Dawg },
    data: () => ({ element: patternElement, duration: 2 }),
  }));

storiesOf('Note', module)
  .add('default', () => ({
    template: `
    <dawg>
      <note
        :duration.sync="duration"
        :height="18"
        :element="element"
      ></note>
    </dawg>`,
    components: { Note, Dawg },
    data: () => ({ element: new NE({ row: 0, time: 0, duration: 0 }), duration: 2 }),
  }));

const Tester = Vue.component('Tester', {
  template: `
  <div style="background-color: red">{{ value }}</div>
  `,
  props: { value: { type: String, required: true } },
});

const WithPosition = positionable(Tester);

storiesOf('positionable', module)
  .add('default', () => ({
    template: `
    <dawg>
      <with-position
        :left="20"
        :top="20"
        :duration="2"
        value="HELLO"
      ></with-position>
    </dawg>
    `,
    components: { WithPosition, Dawg },
  }));


const Resizable = resizable(Tester);


storiesOf('resizable', module)
  .add('default', () => ({
    template: `
    <dawg>
      <resizable
        :duration.sync="duration"
        :height="40"
        value="HELLO"
      ></resizable>
    </dawg>
    `,
    data: () => ({ duration: 1 }),
    components: { Resizable, Dawg },
  }));
