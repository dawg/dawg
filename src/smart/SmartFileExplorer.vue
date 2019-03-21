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
import { PlacedSample, Sample } from '@/schemas';
import { Extensions, ExtensionData } from '@/modules/explorer/types';

@Component
export default class SmartFileExplorer extends Vue {
  public midiData: ExtensionData;

  public extensions: Extensions = {
    wav: {
      dragGroup: 'arranger',
      load: this.loadWav,
      createTransferData: this.createPrototype,
      preview: this.previewWav,
      stopPreview: this.stopPreview,
    },
    mid: this.midiData,
    midi: this.midiData,
  };

  public loadWav(path: string) {
    const sample = Sample.create(path, loadBuffer(path));
    return sample;
  }

  public createPrototype(sample: Sample) {
    return PlacedSample.create(sample);
  }

  public previewWav(sample: Sample) {
    sample.preview();
  }

  public stopPreview(sample: Sample) {
    sample.stopPreview();
  }
}
</script>

<style lang="sass" scoped>

</style>