<template>
  <button class="button" @click="click">{{ text }}</button>
</template>

<script lang="ts">
import { createComponent } from '@/utils';
import { computed, value } from 'vue-function-api';

export default createComponent({
  name: 'PlayPause',
  props: {
    play: {type: String, default: 'PLAY'},
    stop: {type: String, default: 'STOP'},
  },
  setup(props, context) {
    const playing = value(false);

    function click() {
      if (playing.value) {
        context.emit('stop');
      } else {
        context.emit('play');
      }

      playing.value = !playing.value;
    }

    return {
      text: computed(() => {
        return playing.value ? props.play : props.stop;
      }),
      click,
    };
  },
});
</script>

<style scoped lang="sass">
.button
  border: solid 1px
  padding: 5px
  border-radius: 5px
  user-select: none
</style>
