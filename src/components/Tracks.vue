<template>
  <div class="tracks">
    <d-track
      v-for="(track, i) in tracks" 
      :key="i" 
      :track="track"
    ></d-track>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class Tracks extends Vue {
  @Prop({ type: Array, required: true }) public tracks!: any[];
}
</script>

<style lang="sass" scoped>
</style>