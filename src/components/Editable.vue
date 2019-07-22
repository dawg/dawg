<template>
  <div
    ref="el"
    class="editable"
    :contenteditable="contenteditable"
    @blur="blur"
    @dblclick="dblclick" 
    @input="input"
    @keydown="keydown"
  ></div>
</template>

<script lang="ts">
import { Keys, createComponent } from '@/utils';
import { onMounted, value } from 'vue-function-api';

export default createComponent({
  name: 'Editable',
  props: {
    value: { type: String, required: true },
  },
  setup(props, context) {
    const refs = context.refs as { el: HTMLElement };
    const contenteditable = value(false);

    onMounted(() => {
      refs.el.innerText = props.value;
    });

    function dblclick() {
      contenteditable.value = true;
      context.root.$nextTick(() => {
        refs.el.focus();
        // Select all of the text in the div!
        document.execCommand('selectall', undefined, undefined);
      });
    }

    function blur() {
      contenteditable.value = false;
    }

    function input(e: any) {
      context.emit('input', e.currentTarget.innerText);
    }

    function keydown(e: KeyboardEvent) {
      if (e.keyCode !== Keys.ENTER) { return; }
      refs.el.blur();
    }

    return {
      contenteditable,
      blur,
      dblclick,
      input,
      keydown,
    };
  },
});
</script>

<style lang="sass" scoped>
.editable
  user-select: none
  cursor: default
</style>