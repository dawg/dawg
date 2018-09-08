<template>
  <div class="screen">
    <span class="text">{{ time.min }}</span>
    <span class="text colon">:</span>
    <span class="text">{{ formatNumberLength(time.sec, 2) }}</span>
    <span class="small-text">. {{ formatNumberLength(time.milli, 3) }}</span>
  </div>
</template>

<script>
export default {
  name: 'TimeDisplay',
  props: { time: Object },
  methods: {
    formatNumberLength(num, length) {
      let r = `${num}`;
      while (r.length < length) {
        r = `0${r}`;
      }
      return r;
    },
  },
};
</script>

<style scoped lang="sass">
  @import '~@/styles/screen'

  .colon
    margin: 0 2px
</style>
