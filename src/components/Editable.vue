<template>
  <div
    ref="el"
    class="editable"
    :contenteditable="editable"
    @blur="blur"
    @dblclick="dblclick" 
    @input="input"
    @keydown="keydown"
  ></div>
</template>

<script lang="ts">
import { Keys, update } from '@/utils';
import { onMounted, ref, createComponent, watch } from '@vue/composition-api';

export default createComponent({
  name: 'Editable',
  props: {
    value: { type: String, required: true },
    contenteditable: { type: Boolean, required: false },
    disableDblClick: { type: Boolean, required: false },
  },
  setup(props, context) {
    const el = ref<HTMLElement>(null);
    const editable = ref(props.contenteditable);

    watch(() => {
      if (context.listeners['update:contenteditable']) {
        editable.value = props.contenteditable;
      }
    });

    onMounted(() => {
      if (el.value) {
        el.value.innerText = props.value;
      }
    });

    function dblclick() {
      if (props.disableDblClick) {
        return;
      }

      editable.value = true;
      update(props, context, 'contenteditable', true);
    }

    watch(() => {
      if (!editable.value) {
        return;
      }

      context.root.$nextTick(() => {
        if (el.value) {
          el.value.focus();
        }
        // Select all of the text in the div!
        document.execCommand('selectall', undefined, undefined);
      });
    });

    function blur() {
      editable.value = false;
      update(props, context, 'contenteditable', false);
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
      blur,
      dblclick,
      input,
      keydown,
      el,
      editable,
    };
  },
});
</script>

<style lang="sass" scoped>
.editable
  user-select: none
  cursor: default
</style>