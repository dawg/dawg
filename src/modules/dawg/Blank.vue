<template>
  <div class="secondary blank"></div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class Loading extends Vue {
}
</script>

<style lang="sass" scoped>
.blank
  height: 100%
  width: 100%
</style>