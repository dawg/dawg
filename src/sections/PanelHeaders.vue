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
import { keyLookup } from '@/utils';
import { Note } from '@/core';
import webmidi, { INoteParam, IMidiChannel, InputEventNoteon } from 'webmidi';
import { error } from 'util';
import { constants } from 'fs';
import Transport from '@/modules/audio/transport';
import * as Audio from '@/modules/audio';
import { None } from 'fp-ts/lib/Option';

interface Group {
  icon: string;
  tooltip: string;
  props?: {[key: string]: any};
  callback: (e: MouseEvent) => void;
}

@Component
export default class PanelHeaders extends Vue {

  public isRecording: boolean = false;
  public recordedNotes: {[key: string]: InputEventNoteon} = {};
  public transportLocations: {[key: string]: number} = {};
  public transport: Transport = new Audio.Transport();

  get synthActions(): Group[] {
    return [{
      icon: 'add',
      tooltip: 'Add Instrument',
      callback: this.addInstrument,
    }];
  }

  get pianoRollActions(): Group[] {
    webmidi.enable();

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
    if (!workspace.selectedScore) {
      this.$notify.warning('No Score Found', {
        detail: 'Please create a score before you start recording',
      });
      return;
    }

    this.isRecording = !this.isRecording;

    if (workspace.selectedPattern) {
      this.transport = workspace.selectedPattern.transport;
      this.transport.start();
      general.start();
    }

    const input = webmidi.inputs[0];

    if (input) {
      input.addListener('noteon', 'all',
        (e) => {
          console.log(e.note.name + e.note.octave);
          // Here for debugging
          if (e.note.name in this.recordedNotes) {
            console.log('bug');
          }
          this.recordedNotes[e.note.name] = e;
          // console.log('Received "noteon" message (' + e.note.name + e.note.octave + ').');
        },
      );

      input.addListener('noteoff', 'all',
        (e) => {
          const noteOn = this.recordedNotes[e.note.name];
          delete this.recordedNotes[e.note.name];
          const noteDuration = e.timestamp - noteOn.timestamp;
          const transportLocation = this.transport.progress * (this.transport.loopEnd - this.transport.loopStart);

          if (workspace.selectedScore) {
            const note = new Note(workspace.selectedScore.instrument, {
              row: keyLookup[e.note.name + e.note.octave].id,
              duration: noteDuration / 1000 / 60 * general.project.bpm,
              time: transportLocation / 60  * general.project.bpm,
              velocity: noteOn.rawVelocity,
            });

            console.log(transportLocation * general.project.bpm);
            workspace.selectedScore.notes.push(note);

            if (workspace.selectedPattern) {
              note.schedule(this.transport);
            }
          }
        },
      );
    }
  }

  public stopRecording(event: MouseEvent) {
    this.isRecording = !this.isRecording;
    const input = webmidi.inputs[0];

    if (input) {
      input.removeListener();
    }

    this.transport.pause();
    general.pause();
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