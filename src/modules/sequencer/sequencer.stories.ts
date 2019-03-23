import Vue from 'vue';
import { storiesOf } from '@storybook/vue';
import Dawg from '@/modules/dawg/Dawg.vue';
import PianoRollSequencer from '@/modules/sequencer/PianoRollSequencer.vue';
import PlaylistSequencer from '@/modules/sequencer/PlaylistSequencer.vue';
import Waveform from '@/modules/sequencer/Waveform.vue';
import BeatLines from '@/modules/sequencer/BeatLines';
import { loadFromUrl } from '@/modules/wav/web';
import {
  ScheduledPattern,
  Pattern,
  Score,
  Note as NE,
  ScheduledSample,
  Instrument,
  Track,
  Sample,
  AutomationClip,
  ScheduledAutomation,
} from '@/core';
import { colored, resizable, Note, PatternElement, SampleElement, positionable } from '@/modules/sequencer';
import Transport from '@/modules/audio/transport';
import { range } from '@/utils';
import { Signal } from '@/modules/audio';
import Tone from 'tone';

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
    <temp></temp>
    `,
    components: { Temp, Dawg },
  }));

storiesOf('PianoRollSequencer', module)
  .add('default', () => ({
    template: `
    <piano-roll-sequencer
      style="height: 500px"
      :elements="notes"
      :transport="transport"
      :instrument="instrument"
    ></piano-roll-sequencer>
    `,
    data: () => ({
      notes: [],
      transport: new Transport(),
      instrument: null, // Instrument.default('TEST'),
    }),
    components: { PianoRollSequencer, Dawg },
  }));


// const pattern = Pattern.create('Test Pattern');
// const score = Score.create(Instrument.default('wow'));
// pattern.scores = [score];
// score.notes = notes.map((note) => new NE(note));
// const patternElement = ScheduledPattern.create(pattern);

storiesOf('PlaylistSequencer', module)
.add('default', () => ({
  template: `
  <playlist-sequencer
    style="height: 500px"
    :elements="elements"
    :prototype="element"
    :transport="transport"
    :tracks="tracks"
  ></playlist-sequencer>
  `,
  data: () => ({
    transport: new Transport(),
    elements: [],
    buffer: null,
    element: null, // patternElement,
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

const clip = AutomationClip.create(
  1,
  new Signal(new Tone.Signal()),
  'instrument',
  '',
);

storiesOf('AutomationClipElement', module)
  .add('Standard', () => ({
    template: `
    <automation-clip-element
      style="margin: 20px;"
      :element="element"
      :height="50"
      :duration.sync="element.duration"
    ></automation-clip-element>
    `,
    data: () => ({
      clip,
      element: ScheduledAutomation.create(clip, 0, 0, 1),
    }),
  }));

storiesOf('SampleElement', module)
  .add('default', () => ({
    template: `
    <sample-element
      v-if="element"
      :height="40"
      :element="element"
      :duration.sync="duration"
    ></sample-element>
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
        const sample = Sample.create('', buffer);

        return ScheduledSample.create(sample);
      },
    },
  }));

storiesOf('PatternElement', module)
  .add('default', () => ({
    template: `
    <pattern-element
      :duration.sync="duration"
      :height="40"
      :element="element"
    ></pattern-element>
    `,
    components: { PatternElement, Dawg },
    data: () => ({
      element: null, // patternElement,
      duration: 2,
    }),
  }));

storiesOf('Note', module)
  .add('default', () => ({
    template: `
    <note
      :duration.sync="duration"
      :height="18"
      :element="element"
    ></note>
    `,
    components: { Note, Dawg },
    data: () => ({ element: { row: 0, time: 0, duration: 0 } }),
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
    <with-position
      :left="20"
      :top="20"
      :duration="2"
      value="HELLO"
    ></with-position>
    `,
    components: { WithPosition, Dawg },
  }));


const Resizable = resizable(Tester);


storiesOf('resizable', module)
  .add('default', () => ({
    template: `
    <resizable
      :duration.sync="duration"
      :height="40"
      value="HELLO"
    ></resizable>
    `,
    data: () => ({ duration: 1 }),
    components: { Resizable, Dawg },
  }));

const Colored = colored(Tester);

storiesOf('colored', module)
  .add('default', () => ({
    template: `
    <colored
      style="width: 100px; height: 50px"
      value="HELLO"
    ></colored>
    `,
    components: { Colored },
  }));
