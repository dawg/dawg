<template>
  <div class="octave-container">
    <div class="octave">
      <key
          v-for="(note, index) in notes"
          :key="note"
          :note="note"
          :synth="synth"
          :border="borderBottom || index !== notes.length - 1"/>
    </div>
  </div>
</template>

<script>
import Tone from 'tone';
import Key from '@/components/Key.vue';
import { notes } from '@/utils';

const synth = new Tone.Synth().toMaster();

export default {
  name: 'Piano',
  components: { Key },
  data() {
    return { synth };
  },
  props: {
    octave: { default: 4, type: Number },
    borderBottom: { type: Boolean, default: false },
  },
  computed: {
    notes() {
      return notes.map(n => `${n.value}${this.octave}`).reverse();
    },
  },
};
</script>

<style scoped lang="sass">
  .octave
    width: 250px
    box-shadow: 0 0 40px -5px rgba(0,0,0,0.4)
    display: inline-block
</style>
