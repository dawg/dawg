<template>
  <div class="audio-files">
    <drag
      v-for="(item, i) in items"
      group="arranger"
      :key="i"
      @click.native="start(item.sample)"
      @contextmenu.native="context($event, i)"
      class="sample"
      :transfer-data="item.prototype"
    >
      {{ item.sample.name }}
    </drag>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { cache, general, workspace } from '@/store';
import { ScheduledSample, Sample } from '@/core';

@Component
export default class AudioFiles extends Vue {
  public currentlyPlaying: Sample | null = null;

  get items() {
    return general.project.samples.map((sample) => {
      return {
        prototype: ScheduledSample.create(sample),
        sample,
      };
    });
  }

  public context(event: MouseEvent, i: number) {
    this.$context({
      event,
      items: [
        {
          text: 'Delete',
          callback: () => general.project.removeSample(i),
        },
      ],
    });
  }

  public start(sample: Sample) {
    if (this.currentlyPlaying) {
      this.currentlyPlaying.stopPreview();
    }

    sample.preview();
    this.currentlyPlaying = sample;
  }
}
</script>

<style lang="sass" scoped>
.sample
  padding: 10px 20px
  color: white

  &:hover
    box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.1)
    cursor: pointer
</style>