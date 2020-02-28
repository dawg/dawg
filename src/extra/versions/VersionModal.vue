<template>
  <dg-modal :value="value" @input="update">
    <template v-slot:body>
      <div class=" whitespace-pre-line text-default p-8">
        {{ versionString }}
      </div>
      <div class="flex px-8 pb-8">
        <dg-button @click="copy">
          Copy
        </dg-button>
        <div style="flex: 0 0 10px"></div>
        <dg-button @click="close">
          OK
        </dg-button>
      </div>
    </template>
  </dg-modal>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import { remote } from 'electron';
const { app, clipboard }  = remote;

export default createComponent({
  name: 'VersionModal',
  props: { value: { type: Boolean, required: true } },
  setup(props, context) {
    const versions: { [k: string]: string } = {
      Version: app.getVersion(),
      Date: (new Date()).toISOString(),
      V8: process.versions.v8,
      Chrome: process.versions.chrome,
      Node: process.versions.node,
      OS: navigator.userAgent,
    };

    const versionString = Object.keys(versions).map((key) => {
      return `${key}: ${versions[key]}`;
    }).join('\n');

    return {
      versionString,
      update: (value: boolean) => {
        context.emit('input', value);
      },
      copy: () => {
        clipboard.writeText(versionString);
        context.emit('input', false);
      },
      close: () => {
        context.emit('input', false);
      },
    };
  },
});
</script>

<style lang="sass" scoped>

</style>