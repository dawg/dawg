<template>
  <file-explorer
    v-bind="$attrs"
    v-on="$listeners"
    :extensions="extensions"
  ></file-explorer>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { loadBuffer } from '@/modules/wav/local';
import { ScheduledSample, Sample } from '@/core';
import { Extensions, ExtensionData } from '@/modules/explorer/types';
import parser, { INotes } from '@/midi-parser';
import fs from 'mz/fs';

@Component
export default class SmartFileExplorer extends Vue {
  public extensions: Extensions = {
    wav: {
      dragGroup: 'arranger',
      iconComponent: 'wav-icon',
      load: this.loadWav,
      createTransferData: this.createPrototype,
      preview: this.previewWav,
      stopPreview: this.stopPreview,
    },
    mid: {
      dragGroup: 'midi',
      iconComponent: 'midi-icon',
      load: this.loadMidi,
    },
    midi: {
      dragGroup: 'midi',
      iconComponent: 'midi-icon',
      load: this.loadMidi,
    },
  };

  public async loadWav(path: string) {
    const buffer = await loadBuffer(path);
    const sample = Sample.create(path, buffer);
    return sample;
  }

  public createPrototype(sample: Sample) {
    return ScheduledSample.create(sample);
  }

  public previewWav(sample: Sample) {
    sample.preview();
  }

  public stopPreview(sample: Sample) {
    sample.stopPreview();
  }

  public async loadMidi(path: string) {
    const buffer = await fs.readFile(path);
    const ab = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(ab);
    buffer.forEach((value, i) => {
      view[i] = value;
    });

    return parser.parse(ab);
  }
}
</script>

<style lang="sass" scoped>

</style>