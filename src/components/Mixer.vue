<template>
  <div class="mixer">
    <div v-for="i in range(channels)" :key="i" class="track">
      <div class="color"></div>
      <div class="label">Name</div>
      <ul>
        <li v-for="i in range(10)" :key="i" class="cell">
          <v-icon size="13px" class="close-icon">add</v-icon>
        </li>
      </ul>
      <div class="spacer"></div>
      <div class="controls">
        <div>
          <knob v-model="pan[i]" :size="30" :stroke-width="12"></knob>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Knob from '@/components/Knob.vue';

export default {
  name: 'Mixer',
  components: { Knob },
  props: { channels: { type: Number, default: 10 } },
  data() {
    return {
      pan: Array(this.channels).fill(0),
    };
  },
  methods: {
    range(i) {
      return Array.from(Array(i).keys());
    },
  },
};
</script>

<style scoped lang="sass">
  $dark: #282c34
  $between: #555b63
  $light: #767a82

  ul
    list-style: none

  .color
    background-color: #44b3ff
    height: 5px

  .label
    height: 30px
    line-height: 30px
    background-color: $dark
    color: white
    text-align: center
    vertical-align: text-bottom

  .mixer
    background-color: $light
    display: inline-flex
    height: 400px

  .track
    height: 100%
    width: 100px
    border-right: solid 1px $dark

  .cell
    height: 20px
    border-top: solid 1px $between
    position: relative

    &:hover
      cursor: pointer
      background-color: darken($light, 2%)

      .close-icon
        transform: scale(1)
        transition-duration: .3s

    &:last-of-type
      border-bottom: solid 1px $between

  .close-icon
    right: 0.5em
    z-index: 2
    width: 1.5em
    height: 1.5em
    line-height: 1.5
    text-align: center
    border-radius: 3px
    overflow: hidden
    transform: scale(0)
    transition: transform .08s
    position: absolute

  .controls
    padding: 10px
</style>
