import Vue from 'vue';
import { manager } from '@/dawg/extensions/manager';
import { project } from '@/dawg/extensions/core/project';
import { workspace, general } from '@/store';
import { record } from '@/dawg/extensions/core/record';
import { ScheduledPattern, ScheduledSample } from '@/core';
import { value } from 'vue-function-api';
import { ui } from '@/dawg/ui';
import { Ghost } from '@/core/ghosts/ghost';

export const playlist = manager.activate({
  id: 'dawg.playlist',
  activate() {
    const masterStart = value(0);
    const masterEnd = value(0);
    const ghosts: Ghost[] = [];

    const component = Vue.extend({
      template: `
      <playlist-sequencer
        :tracks="p.tracks"
        :elements="p.master.elements"
        :transport="p.master.transport"
        :play="playlistPlay"
        :start.sync="masterStart.value"
        :end.sync="masterEnd.value"
        :steps-per-beat="p.stepsPerBeat"
        :beats-per-measure="p.beatsPerMeasure"
        :row-height="workspace.playlistRowHeight"
        @update:rowHeight="workspace.setPlaylistRowHeight"
        :px-per-beat="workspace.playlistBeatWidth"
        @update:pxPerBeat="workspace.setPlaylistBeatWidth"
        @new-prototype="checkPrototype"
        :is-recording="recording.value"
        :ghosts="ghosts"
      ></playlist-sequencer>
      `,
      data: () => ({
        project: project.getProject(),
        workspace,
        recording: record.recording,
        p,

        // We need these to be able to keep track of the start and end of the playlist loop
        // for creating automation clips
        masterStart,
        masterEnd,
        ghosts,
      }),
      computed: {
        playlistPlay() {
          return general.play && workspace.applicationContext === 'playlist';
        },
        async project() {
          return await project.getProject();
        },
      },
      methods: {
        /**
         * Whenever we add a sample, if it hasn't been imported before, add it the the list of project samples.
         */
        async checkPrototype(prototype: ScheduledPattern | ScheduledSample) {
          if (prototype.component !== 'sample-element') {
            return;
          }

          const sample = prototype.sample;
          if ((await this.project).samples.indexOf(prototype.sample) >= 0) {
            return;
          }

          this.$log.debug('Adding a sample!');
          (await this.project).addSample(sample);
        },
      },
    });

    ui.mainSection.push(component);

    return {
      masterStart,
      masterEnd,
      ghosts,
    };
  },
});
