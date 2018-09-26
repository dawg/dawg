<template>
  <div></div>
</template>

<script>
import NoteSequencer from '@/components/NoteSequencer.vue';
import Knob from '@/components/Knob.vue';

export default {
  name: 'Main',
  components: { Knob, NoteSequencer },
  data() {
    return {
      value: 0,
    };
  },
};
</script>

<style scoped>

</style>
