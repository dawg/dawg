<template>
  <button class="button" @click="click">{{ text }}</button>
</template>

<script>
export default {
  name: 'PlayPause',
  props: { play: { type: String, default: 'PLAY' }, stop: { type: String, default: 'STOP' } },
  data() {
    return {
      text: this.play,
      playing: false,
    };
  },
  methods: {
    click() {
      if (this.playing) {
        this.text = this.play;
        this.$emit('stop');
      } else {
        this.text = this.stop;
        this.$emit('play');
      }
      this.playing = !this.playing;
    },
  },
};
</script>

<style scoped lang="sass">
  .button
    border: solid 1px
    padding: 5px
    border-radius: 5px
</style>
