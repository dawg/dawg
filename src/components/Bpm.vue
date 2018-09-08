<template>
  <div class="screen" :ref="dragRef">
    <div class="text">{{ value }}</div>
    <div class="small-text">bpm</div>
  </div>
</template>

<script>
import { draggable } from '../mixins';

export default {
  name: 'Bpm',
  props: ['value'],
  mixins: [draggable],
  methods: {
    move(e, { changeY }) {
      this.$emit('input', this.value - changeY);
    },
  },
};
</script>

<style scoped lang="sass">
  @import '~@/styles/screen'
</style>
