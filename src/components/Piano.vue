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
          :key-height="keyHeight"
          :synth="synth"
          :border="index !== allKeys.length - 1"
          @start="start"
          @stop="stop"
        ></key>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { allKeys } from '@/utils';
import Key from '@/components/Key.vue';
import { Instrument } from '@/core';
import { createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'Piano',
  components: { Key },
  props: {
    keyHeight: { type: Number, required: true },
    synth: { type: Object as () => Instrument<any, any>, required: true },
  },
  setup(props) {
    return {
      allKeys,
      start(value: string) {
        props.synth.triggerAttack(value);
      },
      stop(value: string) {
        // I'm not sure what would happen if there were two notes playing.
        // I assume it would stop both. I didn't see a way to only stops one.
        props.synth.triggerRelease(value);
      },
    };
  },
});
</script>

<style scoped lang="sass">
.note-wrapper
  position: relative
</style>
