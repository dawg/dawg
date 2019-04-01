<template>
  <button class="button" @click="click"> Separate </button>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { workspace } from '@/store';
import {PythonShell, Options} from 'python-shell';

@Component
export default class Separation extends Vue {
  @Prop({type: String}) public samplePath!: string;

public click() {
    if (this.samplePath) {

      const options: Options = {
        mode: 'text',
        pythonPath: workspace.pythonPath,
        scriptPath: workspace.modelsPath,
        args: [this.samplePath],
      };

      PythonShell.run('vvusic/separation/scripts/separate.py', options, (err?: Error) => {
        if (err) { throw err; }
      });
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
