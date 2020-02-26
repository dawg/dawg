import webmidi, { WebMidiEventConnected, WebMidiEventDisconnected, InputEventNoteon, InputEventNoteoff } from 'webmidi';
import { Extension } from '@/lib/framework/extensions';
import { notify } from '@/core/notify';
import { instruments } from '@/core/instruments';
import { keyLookup } from '@/utils';
import { patterns } from '@/core/patterns';
import { createNotePrototype } from '@/models';
import * as Audio from '@/lib/audio';
import { theme } from '@/core/theme';
import { pianoRoll } from '@/core/piano-roll';
import { ref, computed, watch } from '@vue/composition-api';
import { project } from '@/core/project';
import { controls } from '@/core/controls';

export const extension: Extension = {
  id: 'dawg.midi',
  activate() {
    const selectedScore = instruments.selectedScore;
    const recordedNotes: {[key: string]: InputEventNoteon} = {};
    const notesStartTimes: {[key: string]: number} = {};
    let transport: Audio.Transport | null = null;

    const recording = ref(false);

    const onDidNoteOn = (e: InputEventNoteon) => {
      if (!transport) {
        return;
      }

      if (recording.value) {
        recordedNotes[e.note.name + e.note.octave] = e;
        const transportLocation = transport.getProgress() * (transport.loopEnd - transport.loopStart);
        notesStartTimes[e.note.name + e.note.octave] = transportLocation;
      }

      if (selectedScore.value) {
        selectedScore.value.instrument.triggerAttack(e.note.name + e.note.octave, e.rawVelocity);
      }
    };

    const onDidNoteOff = (e: InputEventNoteoff) => {
      if (!transport) {
        return;
      }

      if (selectedScore.value) {
        selectedScore.value.instrument.triggerRelease(e.note.name + e.note.octave);
      }

      if (!recording.value) {
        return;
      }

      const noteOn = recordedNotes[e.note.name + e.note.octave];
      delete recordedNotes[e.note.name + e.note.octave];

      const noteStartTime = notesStartTimes[e.note.name + e.note.octave];
      delete notesStartTimes[e.note.name + e.note.octave];
      const noteDuration = e.timestamp - noteOn.timestamp;

      if (selectedScore.value) {
        const note = createNotePrototype({
          row: keyLookup[e.note.name + e.note.octave].id,
          duration: noteDuration / 1000 / 60 * project.bpm.value,
          time: noteStartTime,
        }, selectedScore.value.instrument, { velocity: noteOn.rawVelocity })(transport).copy();

        selectedScore.value.notes.add(note);
      }
    };

    const onDidConnected = (event: WebMidiEventConnected) => {
      if (event.port.type !== 'input') {
        return;
      }

      const input = event.port;
      if (!input) {
        return;
      }

      // FIXME This should be added back
      // But we should do something like what Alex does where we cache the name
      // We should also default to having nothing selected
      // And then we would only show this notification when the item in the cache is connected
      // Without this, we just get random MIDI devices that connect
      // this.$notify.success('MIDI Input Detected', {
      //   detail: `${event.port.name} is now connected to Vusic.`,
      // });
      // notify.success('MIDI Input Detected', {
      //   detail: `${event.port.name} is now connected to Vusic.`,
      // });

      input.addListener('noteon', 'all', onDidNoteOn);
      input.addListener('noteoff', 'all', onDidNoteOff);
    };

    const onDidDisconnected = (event: WebMidiEventDisconnected) => {
      if (event.port.type === 'input') {
        notify.warning('MIDI Input Diconnected', {
          detail: `${event.port.name} has been disconnected.`,
        });
      }
    };

    const afterEnable = () => {
      webmidi.addListener('connected', onDidConnected);
      webmidi.addListener('disconnected', onDidDisconnected);
    };

    webmidi.enable(afterEnable);

    function startRecording() {
      if (!instruments.selectedScore.value) {
        notify.warning('No Score Found', {
          detail: 'Please create a score before you start recording',
        });
        return;
      }

      recording.value = !recording.value;

      if (patterns.selectedPattern.value) {
        transport = patterns.selectedPattern.value.transport;
        transport.start();
        controls.startTransport();
      }
    }

    function stopRecording() {
      transport = null;
      recording.value = !recording.value;
      controls.stopTransport();
    }

    const props = {
      color: theme['text-default'],
      size: '14px',
    };

    watch(recording, () => {
      props.color = recording.value ? theme.error : theme['text-default'];
    });

    pianoRoll.addAction({
      icon: ref('fiber_manual_record'),
      tooltip: computed(() => recording.value ? 'Stop Recording' : 'Start Recording'),
      callback: () => {
        if (recording.value) {
          stopRecording();
        } else {
          startRecording();
        }
      },
      props,
    });
  },

  deactivate() {
    const input = webmidi.inputs[0];

    if (input) {
      input.removeListener();
    }
  },
};
