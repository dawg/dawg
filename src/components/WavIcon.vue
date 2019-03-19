<template>
  <svg
    height="32"
    viewBox="0 0 32 32"
    width="32"
    xmlns="http://www.w3.org/2000/svg"
    v-on="$listeners"
    class="svg"
  >
    <path
      d="M8.007 10A3.003 3.003 0 0 0 5 12.999V20A2.996 2.996 0 0 0 8.007 23h16.986A3.003 3.003 0 0 0 28 20.001V13A2.996 2.996 0 0 0 24.993 10H8.007zM12.5 20H12l-1.5-3L9 20H8v-7h1v5l1-2h1l1 2v-5h1v7h-.5zm5.5-3h-3v3h-1v-5c0-1.112.898-2 2.005-2h.99A2 2 0 0 1 19 15v5h-1v-3zm-2.001-3A.997.997 0 0 0 15 15v1h3v-1c0-.552-.443-1-.999-1h-1.002zm6.501 4.25L24 13h1l-2 7h-1l-2-7h1l1.5 5.25z"
      fill="#157EFB"
      fill-rule="evenodd"
    ></path>
  </svg>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class WavIcon extends Vue {}
</script>

<style lang="sass" scoped>
.svg
  margin: -8px -2px
  min-width: 32px
</style>