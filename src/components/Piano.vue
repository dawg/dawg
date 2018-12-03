<template>
  <div class="octave-container">
    <div class="octave">
      <div
        v-for="(note, index) in notes"
        :key="note"
        class="note-wrapper"
      >
        <key
          :note="note"
          :synth="synth"
          :border="borderBottom || index !== notes.length - 1"
        ></key>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Tone from 'tone';
import { Component, Prop } from 'vue-property-decorator';
import { notes, Note } from '@/utils';
import Key from '@/components/Key.vue';

@Component({
  components: { Key },
})
export default class Piano extends Vue {
  @Prop({type: Number, default: 4}) public octave!: number;
  @Prop(Boolean) public borderBottom!: boolean;
  @Prop({ type: Object, required: false }) public synth?: Tone.Synth;
  get notes() {
    return notes.map((n) => `${n.value}${this.octave}`).reverse();
  }
}
</script>

<style scoped lang="sass">
.note-wrapper
  position: relative
</style>
