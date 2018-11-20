<template>
  <div class="octave-container">
    <div class="octave">
      <key
        v-for="(note, index) in notes"
        :key="note"
        :note="note"
        :synth="synth"
        :border="borderBottom || index !== notes.length - 1"
      ></key>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Tone from 'tone';
import { Component, Prop } from 'vue-property-decorator';
import { notes } from '@/utils';
import Key from '@/components/Key.vue';

const synth = new Tone.Synth().toMaster();

@Component({
  components: {Key},
})
export default class Piano extends Vue {
  @Prop({type: Number, default: 4}) public octave!: number;
  @Prop(Boolean) public borderBottom!: boolean;
  public synth = synth;

  get notes() {
    return notes.map((n) => `${n.value}${this.octave}`).reverse();
  }
}
</script>

<style scoped lang="sass">
  .octave
    box-shadow: 0 0 40px -5px rgba(0,0,0,0.4)
    display: inline-block
</style>
