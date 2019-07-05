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
import { general, workspace } from '@/store';
import { Watch } from '@/modules/update';
import { PanelNames } from '@/constants';
import { keyLookup } from '@/utils';
import { Note } from '@/core';
import webmidi, { INoteParam, IMidiChannel, InputEventNoteon } from 'webmidi';
import { error } from 'util';
import Transport from '@/modules/audio/transport';
import * as Audio from '@/modules/audio';
import { Player } from 'soundfont-player';
import * as dawg from '@/dawg';

interface Group {
  icon: string;
  tooltip: string;
  props?: {[key: string]: any};
  callback: (e: MouseEvent) => void;
}

@Component
export default class PanelHeaders extends Vue {

  public recordedNotes: {[key: string]: InputEventNoteon} = {};
  public notesStartTimes: {[key: string]: number} = {};
  public transport: Transport = new Audio.Transport();

  get selectedScore() {
    return dawg.instruments.selectedScore.value;
  }

  public mounted() {
    webmidi.enable((err) => {
      webmidi.addListener('connected', (event) => {
        if (event.port.type === 'input') {
          const input = event.port;
          if (input) {
            dawg.notify.success('MIDI Input Detected', {
              detail: `${event.port.name} is now connected to Vusic.`,
            });
            input.addListener('noteon', 'all',
              (e) => {
                if (general.isRecording) {
                  this.recordedNotes[e.note.name + e.note.octave] = e;
                  const transportLocation = this.transport.progress *
                                            (this.transport.loopEnd - this.transport.loopStart);
                  this.notesStartTimes[e.note.name + e.note.octave] = transportLocation / 60  * general.project.bpm;
                }

                if (this.selectedScore) {
                  this.selectedScore.instrument.triggerAttack(e.note.name + e.note.octave, e.rawVelocity);
                }
              },
            );

            input.addListener('noteoff', 'all',
              (e) => {
                if (general.isRecording) {
                  const noteOn = this.recordedNotes[e.note.name + e.note.octave];
                  delete this.recordedNotes[e.note.name + e.note.octave];

                  const noteStartTime = this.notesStartTimes[e.note.name + e.note.octave];
                  delete this.notesStartTimes[e.note.name + e.note.octave];
                  const noteDuration = e.timestamp - noteOn.timestamp;

                  if (this.selectedScore) {
                    const note = new Note(this.selectedScore.instrument, {
                      row: keyLookup[e.note.name + e.note.octave].id,
                      duration: noteDuration / 1000 / 60 * general.project.bpm,
                      time: noteStartTime,
                      velocity: noteOn.rawVelocity,
                    });

                    this.selectedScore.notes.push(note);

                    if (dawg.patterns.selectedPattern.value) {
                      note.schedule(this.transport);
                    }
                  }
                }

                if (this.selectedScore) {
                  this.selectedScore.instrument.triggerRelease(e.note.name + e.note.octave);
                }
              },
            );
          }
        }
      });

      webmidi.addListener('disconnected', (event) => {
        if (event.port.type === 'input') {
          dawg.notify.warning('MIDI Input Diconnected', {
            detail: `${event.port.name} has been disconnected.`,
          });
        }
      });
    });
  }

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
      tooltip: general.isRecording ? 'Stop Recording' : 'Start Recording',
      callback: general.isRecording ? this.stopRecording : this.startRecording,
      props: {
        color: general.isRecording ? dawg.theme.error : dawg.theme.foreground,
        size: '14px',
      },
    }];
  }

  get actions() {
    // TODO(jacob)
    if (dawg.panels.openedPanel.value === 'Instruments') {
      return this.synthActions;
    } else if (dawg.panels.openedPanel.value === 'Piano Roll') {
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
    dawg.panels.openedPanel.value = name;
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
    if (!this.selectedScore) {
      dawg.notify.warning('No Score Found', {
        detail: 'Please create a score before you start recording',
      });
      return;
    }

    general.toggleRecording();

    if (dawg.patterns.selectedPattern.value) {
      this.transport = dawg.patterns.selectedPattern.value.transport;
      this.transport.start();
      general.start();
    }
  }

  public stopRecording(event: MouseEvent) {
    general.toggleRecording();
    this.transport.pause();
    general.pause();
  }

  public destroyed() {
    const input = webmidi.inputs[0];

    if (input) {
      input.removeListener();
    }
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
  user-select: none

.text
  align-items: center
  text-decoration: none
  display: inline-block
  padding: 0 2px
  user-select: none

  &:hover
    cursor: default
</style>