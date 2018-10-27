import { storiesOf } from '@storybook/vue';
import { action } from '@storybook/addon-actions';
import Tone from 'tone';
import { FactoryDictionary } from 'typescript-collections';
import DotButton from '@/components/DotButton.vue';
import Key from '@/components/Key.vue';
import Sequencer from '@/components/Sequencer.vue';
import Piano from '@/components/Piano.vue';
import Toolbar from '@/components/Toolbar.vue';
import FileExplorer from '@/components/FileExplorer.vue';
import ChannelRack from '@/components/ChannelRack.vue';
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
import { TREE, StyleType, range, makeStyle } from '@/utils';
import stillDre from '@/assets/still-dre';
import notification from '@/notification';
import Notifications from '@/notification/Notifications.vue';
import Foot from '@/components/Foot.vue';
import Vue from 'vue';

Vue.use(notification);

const synth = new Tone.Synth().toMaster();

storiesOf(Piano.name, module)
  .add('Standard', () => ({
    template: '<piano :octave="4"/>',
    components: { Piano },
  }));

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
    template: '<key note="C#4" :synth="synth"/>',
    components: { Key },
  }));

const piano = new Tone.PolySynth(4, Tone.Synth, {
    volume: -8,
    oscillator: {
      partials: [1, 2, 1],
    },
    portamento: 0.05,
}).toMaster();

storiesOf(Sequencer.name, module)
  .add('Standard', () => ({
    template: '<sequencer :note-width="20" :note-height="16" v-model="notes" :measures.sync="measures"/>',
    data: () => ({ notes: [], measures: 1 }),
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
                    v-model="notes"
                ></sequencer>
                <play-pause @play="play" @stop="stop"/>
                <span style="display: block">{{ processed }}</span>
              </div>
              `,
    data() {
      return {
        notes: stillDre,
        // @ts-ignore
        part: new Tone.Part(this.callback),
        measures: 1,
      };
    },
    components: { Sequencer, PlayPause },
    computed: {
      processed() {
        const chords = new FactoryDictionary<string, string[]>(Array);
        // @ts-ignore
        this.notes.map(({ time, note }) => chords.getValue(time).push(note));
        return Object.keys(chords).map((time) => [time, chords.getValue(time).sort()]);
      },
    },
    methods: {
      play() {
        Tone.Transport.start();
      },
      stop() {
        Tone.Transport.stop();
      },
      callback(time: string, chord: string) {
        piano.triggerAttackRelease(chord, '8n', time);
      },
      added(note) {
        // @ts-ignore
        this.part.add(note.time, note.note);
      },
      moved({ newTime, oldTime, note }) {
        // @ts-ignore
        this.part.remove(oldTime);
        // @ts-ignore
        this.part.add(newTime, note);
      },
      removed(note) {
        // @ts-ignore
        // tslint:disable-next-line:no-console
        console.log(this.part.at(note.time));
        // this.part.remove(note.time)
      },
    },
    mounted() {
      // @ts-ignore
      this.part.start(0);
      // @ts-ignore
      this.part.loop = true;
      // @ts-ignore
      this.part.humanize = true;
      Tone.Transport.bpm.value = 93;
    },
    watch: {
      measures: {
        immediate: true,
        handler() {
          // @ts-ignore
          this.part.loopEnd = `${this.measures}m`;
        },
      },
    },
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
      click(text) {
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
    <div>
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

