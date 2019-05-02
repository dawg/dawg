<template>
  <button class="button" @click="click"> Separate </button>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { workspace } from '@/store';
import {PythonShell, Options} from 'python-shell';
import { runModel } from '@/models';
import path from 'path';
import * as dawg from '@/dawg';

@Component
export default class Separation extends Vue {
  @Prop({type: String}) public samplePath!: string;

  // TODO(jacob refactor duplication)
  public click() {
    const provider = dawg.busy(`Extracting vocals from ${path.basename(this.samplePath)}`);

    runModel({
      pythonPath: workspace.pythonPath,
      modelsPath: workspace.modelsPath,
      scriptPath: 'vusic/separation/scripts/separate.py',
      samplePath: this.samplePath,
      cb: (result) => {
        provider.dispose();
        if (result.type === 'error') {
          dawg.notify.error(result.message, {
            detail: result.details,
            duration: Infinity,
          });
        }

        if (result.type === 'success') {
          dawg.notify.success(result.message, {detail: result.details});
        }
      },
    });
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
