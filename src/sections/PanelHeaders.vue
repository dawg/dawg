<template>
  <ul class="tabs-headers">
    <li
      v-for="(tab, i) in tabs"
      :key="i" 
      :class="{ 'is-active': tab.isActive }"
      class="tabs-header"
    >
      <div @click="selectPanel(tab.name)" class="text foreground--text">{{ tab.name }}</div>
    </li>
    <div style="flex-grow: 1"></div>
    <tooltip-icon
      class="action"
      v-for="action in actions"
      :key="action.icon"
      :tooltip="action.tooltip"
      v-bind="action.props"
      bottom
      @click.native="action.callback"
    >
      {{ action.icon }}
    </tooltip-icon>
  </ul>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import BaseTabs from '@/components/BaseTabs.vue';
import { Nullable } from '@/utils';
import { cache, general, workspace } from '@/store';
import { Watch } from '@/modules/update';
import { PanelNames } from '@/constants';
import webmidi, { INoteParam, IMidiChannel } from 'webmidi';
import { error } from 'util';

interface Group {
  icon: string;
  tooltip: string;
  props?: {[key: string]: any};
  callback: (e: MouseEvent) => void;
}

@Component
export default class PanelHeaders extends Vue {

  public isRecording: boolean = false;
  public navigator = require('jzz');

  get synthActions(): Group[] {
    return [{
      icon: 'add',
      tooltip: 'Add Instrument',
      callback: this.addInstrument,
    }];
  }

  get pianoRollActions(): Group[] {
    return [{
      icon: 'fiber_manual_record',
      tooltip: this.isRecording ? 'Stop Recording' : 'Start Recording',
      callback: this.isRecording ? this.stopRecording : this.startRecording,
      props: {color: this.isRecording ? this.$theme.error : this.$theme.foreground},
    }];
  }

  get actions() {
    // TODO NO Type Checking
    if (workspace.openedPanel === 'Instruments') {
      return this.synthActions;
    } else if (workspace.openedPanel === 'Piano Roll') {
      return this.pianoRollActions;
    } else {
      return [];
    }
  }

  get tabs() {
    if (general.panels) {
      return general.panels.tabs;
    } else {
      return [];
    }
  }

  public selectPanel(name: PanelNames) {
    workspace.setOpenedPanel(name);
  }

  public addInstrument(event: MouseEvent) {
    this.$menu({
      event,
      items: [
        {
          text: 'Synth',
          callback: () => general.project.addInstrument('Synth'),
        },
        {
          text: 'Soundfont',
          callback: () => general.project.addInstrument('Soundfont'),
        },
      ],
      left: true,
    });
  }

  public startRecording(event: MouseEvent) {
    this.isRecording = !this.isRecording;

    webmidi.enable((err) => {
      if (err) {
        console.log('WebMidi could not be enabled.', err);
      } else {
        console.log('WebMidi enabled!');
      }
    });

    console.log('inputs', webmidi.inputs);
    console.log(webmidi.outputs);
  }
  //   if (this.navigator.requestMIDIAccess) {
  //     this.navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  //   }

  //   function onMIDISuccess(midiAccess: any) {
  //     const inputs = midiAccess.inputs;
  //     const outputs = midiAccess.outputs;

  //     // Attach MIDI event "listeners" to each input
  //     for (const input of midiAccess.inputs.values()) {
  //         input.onmidimessage = getMIDIMessage;
  //     }
  //   }

  //   function onMIDIFailure() {
  //     console.log('Could not access your MIDI devices.');
  //   }

  //   function getMIDIMessage(message: any) {
  //     console.log(message);
  //     const command = message.data[0];
  //     const note = message.data[1];
  //     const velocity = (message.data.length > 2) ? message.data[2] : 0;

  //     switch (command) {
  //         case 144: // note on
  //             if (velocity > 0) {
  //                 noteOn(note);
  //             } else {
  //                 noteOff(note);
  //             }
  //             break;
  //     }
  //   }

  //   // Function to handle noteOn messages (ie. key is pressed)
  //   // Think of this like an 'onkeydown' event
  //   function noteOn(note: any) {
  //     console.log('on', note);
  //   }

  //   // Function to handle noteOff messages (ie. key is released)
  //   // Think of this like an 'onkeyup' event
  //   function noteOff(note: any) {
  //    console.log('off', note);
  //   }

  //   this.navigator.close();

  // }

  public stopRecording(event: MouseEvent) {
    this.isRecording = !this.isRecording;
  }
}
</script>

<style lang="sass" scoped>
.tabs-headers
  align-items: stretch
  display: flex
  padding: 0

.tabs-header
    position: relative
    color: #999
    font-size: 14px
    font-weight: 600
    list-style: none
    text-align: center
    padding: .75em 1em

    &.is-active
      color: #000
      box-shadow: unset
      
      & .text
        border-bottom: 1px solid

.action
  padding: .75em 1em

.text
  align-items: center
  text-decoration: none
  display: inline-block
  padding: 0 2px
  user-select: none

  &:hover
    cursor: default
</style>