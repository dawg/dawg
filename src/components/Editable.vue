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

    onMounted(() => {
      if (el.value) {
        el.value.innerText = props.value;
      }
    });

    function dblclick() {
      if (props.disableDblClick) {
        return;
      }

      update(props, context, 'contenteditable', true);
    }

    watch(() => {
      if (!props.contenteditable) {
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
    };
  },
});
</script>

<style lang="sass" scoped>
.editable
  user-select: none
  cursor: default
</style>