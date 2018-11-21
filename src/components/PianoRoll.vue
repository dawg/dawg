<template>
  <div class="piano-roll">
    <div class="pianos">
      <piano
        v-for="octave in octaves"
        :key="octave"
        :octave="octave"
      ></piano>
    </div>
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
  public octaves = [4, 5];
}
</script>

<style lang="sass" scoped>
.piano-roll
  display: flex
  border-top: 1px solid #111
  height: 100%
  overflow-y: scroll

.pianos
  display: flex
  flex-direction: column
</style>