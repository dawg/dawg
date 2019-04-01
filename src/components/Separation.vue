<template>
  <button class="button" @click="click"> Separate </button>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { workspace } from '@/store';

@Component
export default class Separation extends Vue {
  @Prop({type: String}) public samplePath!: string;

  public click() {
    if (this.samplePath) {
      console.log(workspace.pythonPath);
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
