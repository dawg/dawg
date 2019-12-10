<template>
  <div class="audio-files">
    <drag
      v-for="(item, i) in items"
      group="arranger"
      :key="i"
      @click.native="start(item.sample)"
      @contextmenu.native="context($event, i)"
      class="text-default text-sm py-2 px-4 cursor-pointer hover:bg-default-lighten-2"
      :transfer-data="item.prototype"
    >
      {{ item.sample.name }}
    </drag>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { ScheduledSample, Sample } from '@/core';
import * as dawg from '@/dawg';

@Component
export default class AudioFiles extends Vue {
  public dispose: (() => void) | null = null;

  get items() {
    return dawg.project.project.samples.map((sample) => {
      return {
        prototype: ScheduledSample.create(sample),
        sample,
      };
    });
  }

  public context(event: MouseEvent, i: number) {
    dawg.context({
      position: event,
      items: [
        {
          text: 'Delete',
          callback: () => dawg.project.project.removeSample(i),
        },
      ],
    });
  }

  public start(sample: Sample) {
    if (this.dispose) {
      this.dispose();
      this.dispose = null;
    }

    const result = sample.preview();
    if (result.started) {
      this.dispose = result.dispose;
    }
  }
}
</script>
