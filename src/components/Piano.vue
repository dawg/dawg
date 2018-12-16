<template>
  <div class="octave-container">
    <div class="octave">
      <div
        v-for="(key, index) in allKeys"
        :key="key.value"
        class="note-wrapper"
      >
        <key
          :value="key.value"
          :synth="synth"
          :border="index !== allKeys.length - 1"
          @press="play"
        ></key>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Tone from 'tone';
import { Component, Prop } from 'vue-property-decorator';
import { allKeys } from '@/utils';
import Key from '@/components/Key.vue';

@Component({
  components: { Key },
})
export default class Piano extends Vue {
  @Prop({ type: Object, required: false }) public synth?: Tone.Synth;
  public allKeys = allKeys;
  public play(value: string) {
    if (this.synth) {
      // TODO This should be longer. Actually, I'm not entirely sure what to do.
      this.synth.triggerAttackRelease(value, '8n');
    }
  }
}
</script>

<style scoped lang="sass">
.note-wrapper
  position: relative
</style>
