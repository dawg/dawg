<template>
  <div
    v-if="value" class="fixed top-0 right-0 bottom-0 left-0 z-50 overflow-scroll py-4"
    style="background-color: rgba(0, 0, 0, 0.5);"
    role="dialog"
  >
    <div class="relative m-auto" :style="`width: ${width}px`">
      <div class="relative bg-default rounded shadow-2xl">
        <div class="border-b border-default-darken-3">
          <slot name="header"></slot>
        </div>
        <div>
          <slot name="body"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { createComponent, watch } from '@vue/composition-api';
import * as dawg from '@/dawg';

export default createComponent({
  name: 'DgModal',
  props: {
    value: { type: Boolean },
    width: { type: Number, default: 600 },
  },
  setup(props, context) {
    let dispose: (() => void) | undefined;
    watch(() => {
      // Always dispose
      // We are either closing it or opening it (in which case we will create a new listener)
      if (dispose) {
        dispose();
      }

      if (props.value) {
        dispose = dawg.commands.registerShortcut({
          shortcut: ['Esc'],
          callback: () => {
            context.emit('input', false);
          },
        }).dispose;
      }
    });
  },
});
</script>
