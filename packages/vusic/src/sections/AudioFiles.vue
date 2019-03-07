<template>
  <div class="audio-files">
    <drag
      v-for="(item, i) in items"
      group="arranger"
      :key="i"
      @click.native="start(item.sample)"
      class="sample"
      :transfer-data="item.prototype"
    >
      {{ item.sample.name }}
    </drag>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { project, cache, general, specific } from '@/store';
import { PlacedSample, Sample } from '@/schemas';

@Component
export default class AudioFiles extends Vue {
  get items() {
    return project.samples.map((sample) => {
      return {
        prototype: PlacedSample.create(sample),
        sample,
      };
    });
  }

  public start(sample: Sample) {
    sample.start();
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