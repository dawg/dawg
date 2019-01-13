<template>
  <div class="phaser ">
    <div class="title white--text">PHASER</div>
    <div>
      <knob
        label="Frequency"
        stroke-class="secondary-lighten-2--stroke"
        v-model="options.frequency"
        :size="size"
      ></knob>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { PhaserOptions } from '@/schemas';

@Component
export default class Phaser extends Vue {
  @Prop({ type: Object, required: true }) public options!: PhaserOptions;
  public size = 30;
}
</script>

<style lang="sass" scoped>
.title
  font-size: 30px

.phaser
  padding: 15px
  min-width: 300px
  text-align: center
</style>