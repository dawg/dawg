// eslint-disable-next-line import/no-extraneous-dependencies
import { storiesOf } from '@storybook/vue';
import Tone from 'tone';

import Sequencer from '@/components/Sequencer.vue';
import Piano from '@/components/Piano.vue';
import Key from '@/components/Key.vue';
import Toolbar from '@/components/Toolbar.vue';
import FileExplorer from '@/components/FileExplorer.vue';
import ChannelRack from '@/components/ChannelRack.vue';
import Knob from '@/components/Knob.vue';
import Tabs from '@/components/Tabs.vue';
import Tab from '@/components/Tab.vue';
import Mixer from '@/components/Mixer.vue';
import Slider from '@/components/Slider.vue';
import TimeDisplay from '@/components/TimeDisplay.vue';
import Bpm from '@/components/Bpm.vue';
import tone from '@/components/Tone.vue';
import Note from '@/components/Note.vue';
import PlayPause from '@/components/PlayPause.vue';
import { DefaultDict, TREE } from '@/utils';

const synth = new Tone.Synth().toMaster();

// noinspection RequiredAttributes
storiesOf(Key.name, module)
  .add('White', () => ({
    data() {
      return { synth };
    },
    template: '<key note="C4" :synth="synth"/>',
    components: { Key },
  }))
  .add('Black', () => ({
    data() {
      return { synth };
    },
    template: '<key note="C#4" :synth="synth">',
    components: { Key },
  }));

storiesOf(Piano.name, module)
  .add('Standard', () => ({
    template: '<piano :octave="4"/>',
    components: { Piano },
  }));

const piano = new Tone.PolySynth(4, Tone.Synth, {
  volume: -8,
  oscillator: {
    partials: [1, 2, 1],
  },
  portamento: 0.05,
}).toMaster();

const notes = [{
  length: 1, row: 11, col: 0, index: -1, x: 0, y: 176, time: '0:0:0', note: 'C5',
}, {
  length: 1, row: 7, col: 0, index: 0, x: 0, y: 112, time: '0:0:0', note: 'E5',
}, {
  length: 1, row: 2, col: 0, index: 1, x: 0, y: 32, time: '0:0:0', note: 'A5',
}, {
  length: 1, row: 11, col: 2, index: 2, x: 40, y: 176, time: '0:0:2', note: 'C5',
}, {
  length: 1, row: 7, col: 2, index: 3, x: 40, y: 112, time: '0:0:2', note: 'E5',
}, {
  length: 1, row: 2, col: 2, index: 4, x: 40, y: 32, time: '0:0:2', note: 'A5',
}, {
  length: 1, row: 11, col: 4, index: 5, x: 80, y: 176, time: '0:1:0', note: 'C5',
}, {
  length: 1, row: 7, col: 4, index: 6, x: 80, y: 112, time: '0:1:0', note: 'E5',
}, {
  length: 1, row: 2, col: 4, index: 7, x: 80, y: 32, time: '0:1:0', note: 'A5',
}, {
  length: 1, row: 11, col: 6, index: 8, x: 120, y: 176, time: '0:1:2', note: 'C5',
}, {
  length: 1, row: 7, col: 6, index: 9, x: 120, y: 112, time: '0:1:2', note: 'E5',
}, {
  length: 1, row: 2, col: 6, index: 10, x: 120, y: 32, time: '0:1:2', note: 'A5',
}, {
  length: 1, row: 2, col: 8, index: 11, x: 160, y: 32, time: '0:2:0', note: 'A5',
}, {
  length: 1, row: 7, col: 8, index: 12, x: 160, y: 112, time: '0:2:0', note: 'E5',
}, {
  length: 1, row: 11, col: 8, index: 13, x: 160, y: 176, time: '0:2:0', note: 'C5',
}, {
  length: 1, row: 11, col: 10, index: 14, x: 200, y: 176, time: '0:2:2', note: 'C5',
}, {
  length: 1, row: 7, col: 10, index: 15, x: 200, y: 112, time: '0:2:2', note: 'E5',
}, {
  length: 1, row: 2, col: 10, index: 16, x: 200, y: 32, time: '0:2:2', note: 'A5',
}, {
  length: 1, row: 2, col: 12, index: 17, x: 240, y: 32, time: '0:3:0', note: 'A5',
}, {
  length: 1, row: 7, col: 12, index: 18, x: 240, y: 112, time: '0:3:0', note: 'E5',
}, {
  length: 1, row: 11, col: 12, index: 19, x: 240, y: 176, time: '0:3:0', note: 'C5',
}, {
  length: 1, row: 7, col: 14, index: 20, x: 280, y: 112, time: '0:3:2', note: 'E5',
}, {
  length: 1, row: 11, col: 14, index: 21, x: 280, y: 176, time: '0:3:2', note: 'C5',
}, {
  length: 1, row: 2, col: 14, index: 22, x: 280, y: 32, time: '0:3:2', note: 'A5',
}, {
  length: 1, row: 12, col: 16, index: 23, x: 320, y: 192, time: '1:0:0', note: 'B4',
}, {
  length: 1, row: 7, col: 16, index: 24, x: 320, y: 112, time: '1:0:0', note: 'E5',
}, {
  length: 1, row: 2, col: 16, index: 25, x: 320, y: 32, time: '1:0:0', note: 'A5',
}, {
  length: 1, row: 12, col: 18, index: 26, x: 360, y: 192, time: '1:0:2', note: 'B4',
}, {
  length: 1, row: 7, col: 18, index: 27, x: 360, y: 112, time: '1:0:2', note: 'E5',
}, {
  length: 1, row: 2, col: 18, index: 28, x: 360, y: 32, time: '1:0:2', note: 'A5',
}, {
  length: 1, row: 2, col: 20, index: 29, x: 400, y: 32, time: '1:1:0', note: 'A5',
}, {
  length: 1, row: 7, col: 20, index: 30, x: 400, y: 112, time: '1:1:0', note: 'E5',
}, {
  length: 1, row: 12, col: 20, index: 31, x: 400, y: 192, time: '1:1:0', note: 'B4',
}, {
  length: 1, row: 12, col: 22, index: 32, x: 440, y: 192, time: '1:1:2', note: 'B4',
}, {
  length: 1, row: 7, col: 22, index: 33, x: 440, y: 112, time: '1:1:2', note: 'E5',
}, {
  length: 1, row: 4, col: 24, index: 36, x: 480, y: 64, time: '1:2:0', note: 'G5',
}, {
  length: 1, row: 7, col: 24, index: 37, x: 480, y: 112, time: '1:2:0', note: 'E5',
}, {
  length: 1, row: 12, col: 24, index: 38, x: 480, y: 192, time: '1:2:0', note: 'B4',
}, {
  length: 1, row: 4, col: 26, index: 39, x: 520, y: 64, time: '1:2:2', note: 'G5',
}, {
  length: 1, row: 7, col: 26, index: 40, x: 520, y: 112, time: '1:2:2', note: 'E5',
}, {
  length: 1, row: 12, col: 26, index: 41, x: 520, y: 192, time: '1:2:2', note: 'B4',
}, {
  length: 1, row: 4, col: 28, index: 42, x: 560, y: 64, time: '1:3:0', note: 'G5',
}, {
  length: 1, row: 7, col: 28, index: 43, x: 560, y: 112, time: '1:3:0', note: 'E5',
}, {
  length: 1, row: 12, col: 28, index: 44, x: 560, y: 192, time: '1:3:0', note: 'B4',
}, {
  length: 1, row: 4, col: 30, index: 45, x: 600, y: 64, time: '1:3:2', note: 'G5',
}, {
  length: 1, row: 7, col: 30, index: 46, x: 600, y: 112, time: '1:3:2', note: 'E5',
}, {
  length: 1, row: 12, col: 30, index: 47, x: 600, y: 192, time: '1:3:2', note: 'B4',
}, {
  length: 1, row: 4, col: 22, index: 48, x: 440, y: 64, time: '1:1:2', note: 'G5',
}];

storiesOf(Sequencer.name, module)
  .add('Standard', () => ({
    template: '<sequencer :note-width="20" :note-height="16" v-model="notes"/>',
    data: () => ({ notes: [] }),
    components: { Sequencer },
  }))
  .add('Playable', () => ({
    template: `<div>
                <sequencer
                    :note-width="20"
                    :note-height="16"
                    :measures.sync="measures"
                    @added="added"
                    @removed="removed"
                    v-model="notes"/>
                <play-pause @play="play" @stop="stop"/>
                <span style="display: block">{{ processed }}</span>
              </div>
              `,
    data() {
      return { notes, part: new Tone.Part(this.callback), measures: 1 };
    },
    components: { Sequencer, PlayPause },
    computed: {
      processed() {
        const chords = new DefaultDict(Array);
        this.notes.map(({ time, note }) => chords[time].push(note));
        return Object.keys(chords).map(time => [time, chords[time].sort()]);
      },
    },
    methods: {
      play() {
        Tone.Transport.start();
      },
      stop() {
        Tone.Transport.stop();
      },
      callback(time, chord) {
        piano.triggerAttackRelease(chord, '8n', time);
      },
      added(note) {
        this.part.add(note.time, note.note);
      },
      removed(note) {
        console.log(this.part.at(note.time));
        // this.part.remove(note.time)
      },
    },
    mounted() {
      this.part.start(0);
      this.part.loop = true;
      this.part.humanize = true;
      Tone.Transport.bpm.value = 93;
    },
    watch: {
      measures: {
        immediate: true,
        handler() {
          this.part.loopEnd = `${this.measures}m`;
        },
      },
    },
  }));

storiesOf(Toolbar.name, module)
  .add('Standard', () => ({
    template: '<v-app dark><toolbar/></v-app>',
    components: { Toolbar },
  }));

// noinspection RequiredAttributes
storiesOf(FileExplorer.name, module)
  .add('Standard', () => ({
    template: `
    <v-app dark>
      <v-list dense style="max-width: 300px; height: 100%">
        <file-explorer :children="children.root" label="root"></file-explorer>
      </v-list>
    </v-app>
    `,
    components: { FileExplorer },
    data() {
      return {
        children: TREE,
      };
    },
  }));

storiesOf(ChannelRack.name, module)
  .add('Standard', () => ({
    template: `
    <v-app dark>
      <channel-rack :instruments="instruments" style="max-width: 300px"></channel-rack>
    </v-app>
    `,
    components: { ChannelRack },
    data() {
      return {
        instruments: ['Synth A', 'SynthB'],
      };
    },
  }));

storiesOf(Knob.name, module)
  .add('Standard', () => ({
    template: '<knob v-model="value" style="margin: 50px"></knob>',
    components: { Knob },
    data() {
      return { value: 0 };
    },
  }))
  .add('Potentiometer', () => ({
    template: '<knob v-model="value" style="margin: 50px" potentiometer></knob>',
    components: { Knob },
    data() {
      return { value: 0 };
    },
  }));

storiesOf(Tabs.name, module)
  .add('Standard', () => ({
    template: `
     <tabs>
       <tab name="Playlist 1">
         This is the content of the first tab
       </tab>
       <tab name="Sequence 1">
         This is the content of the second tab
       </tab>
       <tab name="Sequence 2" :is-disabled="true">
         This content will be unavailable while :is-disabled prop set to true
       </tab>
       <tab name="Sequence 4">
           The fragment that is appended to the url can be customized
       </tab>
       <tab name="Master">
          A prefix and a suffix can be added
       </tab>
    </tabs>
    `,
    components: { Tab, Tabs },
  }));

storiesOf(Mixer.name, module)
  .add('Standard', () => ({
    template: `
    <mixer></mixer>
    `,
    components: { Mixer },
  }));

storiesOf(Slider.name, module)
  .add('Standard', () => ({
    template: `
    <slider v-model="value" :left="46" :right="50"></slider>
    `,
    components: { Slider },
    data: () => ({ value: 70 }),
  }));

storiesOf(Bpm.name, module)
  .add('Standard', () => ({
    template: `
    <bpm v-model="value"></bpm>
    `,
    components: { Bpm },
    data: () => ({ value: 128 }),
  }));

storiesOf(TimeDisplay.name, module)
  .add('Standard', () => ({
    template: `
    <time-display :time="time"></time-display>
    `,
    components: { TimeDisplay },
    data: () => ({ time: { min: 0, sec: 0, milli: 0 } }),
  }));

storiesOf(Note.name, module)
  .add('Standard', () => ({
    template: `
    <v-stage :config="{height: 200, width: 200}">
      <v-layer>
        <note :height="16" v-model="length" :width="20" text="C5"></note>
      </v-layer>
    </v-stage>
    `,
    components: { Note },
    data: () => ({ length: 4 }),
  }));

storiesOf(tone.name, module)
  .add('Standard', () => ({
    template: `
    <tone></tone>
    `,
    components: { tone },
  }));

storiesOf(PlayPause.name, module)
  .add('Standard', () => ({
    template: `
    <div>
      <play-pause @play="text = 'playing'" @stop="text = 'stopped'"/>
      <span>{{ text }}</span>
    </div>
    `,
    data: () => ({ text: 'stopped' }),
    components: { PlayPause },
  }));
