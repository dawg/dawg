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
import { Keys } from '@/utils';
import { onMounted, ref, createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'Editable',
  props: {
    value: { type: String, required: true },
  },
  setup(props, context) {
    const el = ref<HTMLElement>(null);
    const contenteditable = ref(false);

    onMounted(() => {
      if (el.value) {
        el.value.innerText = props.value;
      }
    });

    function dblclick() {
      contenteditable.value = true;
      context.root.$nextTick(() => {
        if (el.value) {
          el.value.focus();
        }
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
      if (el.value) {
        el.value.blur();
      }
    }

    return {
      contenteditable,
      blur,
      dblclick,
      input,
      keydown,
      el,
    };
  },
});
</script>

<style lang="sass" scoped>
.editable
  user-select: none
  cursor: default
</style>