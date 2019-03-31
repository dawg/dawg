<template>
  <button class="button" @click="click"> Transcribe </button>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class Transcription extends Vue {
  @Prop({type: String}) public samplePath!: string;

  public click() {
    if (this.samplePath) {
      console.log(this.samplePath);
    }
  }
}
</script>

<style scoped lang="sass">
  .button
    border: solid 1px
    padding: 5px
    border-radius: 5px
    user-select: none
</style>
