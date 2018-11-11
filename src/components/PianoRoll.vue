<template>
  <div class="piano-roll">
    <piano></piano>
    <sequencer 
      :note-width="noteWidth" 
      :note-height="noteHeight" 
      :measures="1"
      v-model="notes"
    ></sequencer>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Piano from '@/components/Piano.vue';
import Sequencer from '@/components/Sequencer.vue';

@Component({components: { Piano, Sequencer }})
export default class PianoRoll extends Vue {
  public noteWidth = 20;
  public noteHeight = 16;
  public notes = [];
}
</script>

<style lang="sass" scoped>
.piano-roll
  display: flex
</style>