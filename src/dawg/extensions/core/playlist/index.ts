import Vue from 'vue';
import * as t from '@/modules/io';
import { manager } from '@/base/manager';
import { project } from '@/dawg/extensions/core/project';
// FIXME(2) Remove this import
import { record } from '@/dawg/extensions/core/record';
import { ScheduledPattern, ScheduledSample } from '@/core';
import { ref } from '@vue/composition-api';
import { ui } from '@/base/ui';
import { Ghost } from '@/core/ghost';
import { applicationContext } from '@/dawg/extensions/core/application-context';
import { log } from '@/dawg/extensions/core/log';

export const playlist = manager.activate({
  id: 'dawg.playlist',
  workspace: {
    playlistRowHeight: {
      type: t.number,
      default: 40,
    },
    playlistBeatWidth: {
      type: t.number,
      default: 80,
    },
  },
  activate(context) {
    const masterStart = ref(0);
    const masterEnd = ref(0);
    const ghosts: Ghost[] = [];

    const playlistRowHeight = context.workspace.playlistRowHeight;
    const playlistBeatWidth = context.workspace.playlistBeatWidth;
    const logger = log.getLogger();

    const component = Vue.extend({
      name: 'PlaylistSequencerWrapper',
      template: `
      <playlist-sequencer
        :tracks="project.tracks"
        :sequence="project.master.elements"
        :transport="project.master.transport"
        :play="playlistPlay"
        :start.sync="masterStart.value"
        :end.sync="masterEnd.value"
        :steps-per-beat="project.stepsPerBeat"
        :beats-per-measure="project.beatsPerMeasure"
        :row-height.sync="playlistRowHeight.value"
        :px-per-beat.sync="playlistBeatWidth.value"
        @new-prototype="checkPrototype"
        :is-recording="recording.value"
        :ghosts="ghosts"
      ></playlist-sequencer>
      `,
      data: () => ({
        recording: record.recording,

        // We need these to be able to keep track of the start and end of the playlist loop
        // for creating automation clips
        masterStart,
        masterEnd,
        ghosts,
        project: project.project,
        playlistRowHeight,
        playlistBeatWidth,
      }),
      computed: {
        playlistPlay() {
          return project.state.value === 'started' && applicationContext.context.value === 'playlist';
        },
      },
      methods: {
        /**
         * Whenever we add a sample, if it hasn't been imported before, add it the the list of project samples.
         */
        checkPrototype(prototype: ScheduledPattern | ScheduledSample) {
          if (prototype.component !== 'sample-element') {
            return;
          }

          const sample = prototype.sample;
          if (project.project.samples.indexOf(prototype.sample) >= 0) {
            return;
          }

          logger.debug('Adding a sample!');
          project.project.addSample(sample);
        },
      },
    });

    ui.mainSection.push(component);

    return {
      masterStart,
      masterEnd,
      ghosts,
      playlistRowHeight,
      playlistBeatWidth,
    };
  },
});
