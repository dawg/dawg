import { storiesOf } from '@storybook/vue';
import { action } from '@storybook/addon-actions';
import Tone from 'tone';
import DotButton from '@/components/DotButton.vue';
import Key from '@/components/Key.vue';
import Sequencer from '@/components/Sequencer.vue';
import Piano from '@/components/Piano.vue';
import Toolbar from '@/components/Toolbar.vue';
import Dawg from '@/components/Dawg.vue';
import Tree from '@/components/Tree.vue';
import Knob from '@/components/Knob.vue';
import Mixer from '@/components/Mixer.vue';
import Slider from '@/components/Slider.vue';
import Note from '@/components/Note.vue';
import Bpm from '@/components/Bpm.vue';
import TimeDisplay from '@/components/TimeDisplay.vue';
import PlayPause from '@/components/PlayPause.vue';
import Tabs from '@/components/Tabs.vue';
import Tab from '@/components/Tab.vue';
import ColorBlock from '@/components/ColorBlock.vue';
import { StyleType, range, makeStyle } from '@/utils';
import Foot from '@/components/Foot.vue';
import Notifications from '@/modules/notification/Notifications.vue';
import Synth from '@/components/Synth.vue';
import SequencerRow from '@/components/SequencerRow.vue';
import Split from '@/modules/split/Split.vue';
import BeatLines from '@/components/BeatLines';
import PianoRoll from '@/components/PianoRoll.vue';
import Timeline from '@/components/Timeline.vue';
import MiniScore from '@/components/MiniScore.vue';
import Vue from 'vue';

const synth = new Tone.Synth().toMaster();

const NOTES = [
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

storiesOf(MiniScore.name, module)
  .add('Standard', () => ({
    components: { Dawg, MiniScore },
    template: `
    <dawg>
      <mini-score :notes="notes" style="height: 50px; width: 400px"></mini-score>
    </dawg>
    `,
    data: () => ({
      notes: NOTES,
    }),
  }));

storiesOf(SequencerRow.name, module)
  .add('Standard', () => ({
    template: `
    <dawg>
      <sequencer-row
        v-for="i in 20"
        :key="i"
        :id="40 + i"
        :total-beats="12"
        @click="click"
      ></sequencer-row>
    </dawg>
    `,
    components: { SequencerRow, Dawg },
    methods: {
      click(...args) {
        // tslint:disable-next-line:no-console
        console.log('click', args);
      },
    },
  }));

storiesOf(Piano.name, module)
  .add('Standard', () => ({
    template: `
    <dawg>
      <piano
        :synth="synth"
        style="overflow-y: scroll; height: 500px"
      ></piano>
    </dawg>
    `,
    data: () => ({ synth }),
    components: { Piano, Dawg },
  }));

storiesOf(Key.name, module)
  .add('White', () => ({
    template: `
    <dawg>
      <key value="C4"></key>
    </dawg>
    `,
    components: { Key, Dawg },
  }))
  .add('Black', () => ({
    template: `
    <dawg>
      <key value="C#4"></key>
    </dawg>
    `,
    components: { Key, Dawg },
  }));

const piano = new Tone.PolySynth(8, Tone.Synth).toMaster();

storiesOf(Sequencer.name, module)
  .add('Standard', () => ({
    template: `
    <dawg>
      <sequencer
        :value="notes"
        :measures.sync="measures"
      ></sequencer>
    </dawg>
    `,
    data: () => ({ notes: [], measures: 1 }),
    components: { Sequencer, Dawg },
  }));

storiesOf(DotButton.name, module)
  .add('Standard', () => ({
    components: { DotButton },
    template: '<dot-button @click="click"></dot-button>',
    methods: { click: action('clicked') },
  }));

storiesOf(Toolbar.name, module)
  .add('Standard', () => ({
    template: '<v-app dark><toolbar/></v-app>',
    components: { Toolbar },
  }));

const TREE = {
    root: {
      'folder 1': {
        'item 1': {},
        'folder 2': {
          'item 2': {},
        },
      },
      'item 3': {},
    },
  };

storiesOf(Tree.name, module)
  .add('Standard', () => ({
    template: `
    <v-app dark>
      <v-list dense style="max-width: 300px; height: 100%">
        <tree :children="children.root" label="root"></tree>
      </v-list>
    </v-app>
    `,
    components: { Tree },
    data() {
      return {
        children: TREE,
      };
    },
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
    <dawg>
      <note v-model="length" :id="0" :start="0"></note>
    </dawg>
    `,
    components: { Dawg, Note },
    data: () => ({ length: 1 }),
  }));

storiesOf(Knob.name, module)
  .add('Standard', () => ({
    template: `
      <div>
        <knob
          v-model="value"
          :size="100"
          label="Dry/Wet"
          style="border-radius: 3px; padding: 20px; background-color: #2C2D2F"
        ></knob>
        <div>{{ value }}</div>
      </div>
    `,
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

storiesOf(PlayPause.name, module)
  .add('Standard', () => ({
    template:  `
    <div>
      <play-pause @play="click('playing')" @stop="click('stopped')"/>
      <span>{{ text }}</span>
    </div>
    `,
    data: () => ({ text: 'stopped' }),
    components: { PlayPause },
    methods: {
      click(text: string) {
        action(text)();
        // @ts-ignore
        this.text = text;
      },
    },
  }));


storiesOf(ColorBlock.name, module)
  .add('Example', () => ({
    template:  `<color-block color="primary"></color-block>`,
    components: { ColorBlock },
  }))
  .add('Theme', () => ({
    template: `
    <div style="height: 500px; overflow-y: auto">
      <color-block v-for="color in colors" :key="color" :color="color"></color-block>
    </div>
    `,
    components: { ColorBlock },
    computed: {
      colors(): string[] {
        const colors: string[] = [];
        Object.keys(StyleType).forEach((value: string) => {
          const type = StyleType[value as keyof typeof StyleType];
          colors.push(makeStyle(type));
          range(4).forEach((i) => {
            colors.push(makeStyle(type, {darken: i + 1}));
          });
          range(4).forEach((i) => {
            colors.push(makeStyle(type, {lighten: i + 1}));
          });
        });
        return colors;
      },
    },
  }));


storiesOf(Notifications.name, module)
  .add('Standard', () => ({
    template: `
    <div>
      <div>
        <v-btn @click="info" class="info">INFO</v-btn>
        <v-btn @click="success" class="success">SUCCESS</v-btn>
      </div>
      <div>
        <v-btn @click="warning" class="warning">WARNING</v-btn>
        <v-btn @click="error" class="error">ERROR</v-btn>
      </div>
      <notifications></notifications>
    </div>
    `,
    components: { Notifications },
    methods: {
      info() {
        // @ts-ignore
        this.$notify.info('Information', {detail: 'Here is some info!'});
      },
      success() {
        // @ts-ignore
        this.$notify.success('Success', {detail: 'Something went well!'});
      },
      warning() {
        // @ts-ignore
        this.$notify.warning('Warning', {detail: 'This is bad!'});
      },
      error() {
        // @ts-ignore
        this.$notify.error('Error', {detail: 'Something is probably broken!'});
      },
    },
  }));

storiesOf(Foot.name, module)
  .add('Standard', () => ({
    template: `
    <foot></foot>
    `,
    components: { Foot },
  }));

storiesOf(Synth.name, module)
  .add('Standard', () => ({
    template: `
    <v-app>
      <dawg>
        <synth ref="synth" name="Tester" :notes="notes"></synth>
      </dawg>
      <div>
        <v-btn @click="playme">Play</v-btn>
      </div>
    </v-app>
    `,
    methods: {
      playme() {
        // @ts-ignore
        this.$refs.synth.synth.triggerAttackRelease('C5', '8n');
      },
    },
    data: () => ({ notes: NOTES }),
    components: { Synth, Dawg },
  }));


storiesOf(Split.name, module)
  .add('Horizontal', () => ({
    template: `
    <split direction="horizontal" resizable>
        <split :min-size="100">
            panel left
        </split>
        <split :min-size="100">
            panel center
        </split>
        <split :min-size="300">
            panel right
        </split>
    </split>
    `,
    components: { Split },
  }));


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

storiesOf(Timeline.name, module)
  .add('Standard', () => ({
    template: `
    <dawg>
      <timeline
        :loop-start="start"
        :loop-end="end"
        v-model="time"
        style="width: 400px; height: 20px"
      ></timeline>
    </dawg>
    `,
    data: () => ({ time: 0, start: 0, end: 2 }), // TODO change to 8 for beats
    components: { Timeline, Dawg },
  }))
  .add('With Offset', () => ({
    template: `
    <dawg>
      <timeline
        :loop-start="start"
        :loop-end="end"
        v-model="time"
        style="width: 400px; height: 20px"
        :offset="offset"
      ></timeline>
      <div>
        <input type="range" id="start" name="volume" min="0" max="100" v-model="pixels">
        <label for="volume">Pixel Offset</label>
      </div>
    </dawg>
    `,
    data: () => ({
      time: 0,
      pixels: 0,
      start: 0,
      end: 0,
    }),
    components: { Timeline, Dawg },
    computed: {
      offset() {
        // @ts-ignore
        return this.pixels / this.pxPerBeat;
      },
    },
  }));

storiesOf(PianoRoll.name, module)
  .add('Standard', () => ({
    template: `
    <dawg>
      <piano-roll :synth="piano"></piano-roll>
    </dawg>
    `,
    data: () => ({ piano }),
    components: { PianoRoll, Dawg },
  }));
