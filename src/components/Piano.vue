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
import { Instrument } from '@/models';
import { createComponent } from '@vue/composition-api';
import { Disposer } from '@/lib/std';

export default createComponent({
  name: 'Piano',
  components: { Key },
  props: {
    keyHeight: { type: Number, required: true },
    synth: { type: Object as () => Instrument, required: true },
  },
  setup(props) {

    const disposers: { [k: string]: Disposer } = {};
    return {
      allKeys,
      start(value: string) {
        disposers[value] = props.synth.triggerAttack(value);
      },
      stop(value: string) {
        disposers[value].dispose();
        delete disposers[value];
      },
    };
  },
});
</script>

<style scoped lang="sass">
.note-wrapper
  position: relative
</style>
