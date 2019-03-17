<template>
  <div class="dawg">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Provide } from 'vue-property-decorator';

@Component
export default class Dawg extends Vue {
}
</script>

<style lang="sass" scoped>

</style>