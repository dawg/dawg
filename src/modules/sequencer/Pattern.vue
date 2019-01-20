<template>
  <div class="pattern">
    <mini-score :notes="notes"></mini-score>
    <resizable
      :duration="duration"
      @update:duration="updateDuration"
    ></resizable>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins } from 'vue-property-decorator';
import MiniScore from '@/modules/dawg/MiniScore.vue';
import Resizable from '@/modules/sequencer/Resizable.vue';
import { Note } from '@/schemas';
import { Positionable } from '@/modules/sequencer/sequencer';

@Component({
  components: { MiniScore, Resizable },
})
export default class Pattern extends Mixins(Positionable) {
  @Prop({ type: Array, required: true }) public notes!: Note[];

  // TODO(jacob) Set Actual width based on the duration!!!
}
</script>

<style lang="sass" scoped>

</style>