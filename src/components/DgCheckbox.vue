<template>
  <div 
    role="checkbox"
    tabindex="0"
    class="
      h-5
      w-5 
      rounded-sm 
      dg-checkbox 
      relative
      border
      flex 
      items-center 
      justify-center
      focus:border-primary
      focus:outline-none
    "
    :class="classes"
    @click="click"
    @keydown="keydown"
  >
    <span class="focuser"></span>
    <span v-if="value" class="tick h-5 w-3"></span>
  </div>
</template>

<script lang="ts">
import { createComponent, computed, watch } from '@vue/composition-api';
import { Keys } from '../utils';

export default createComponent({
  props: {
    value: { type: Boolean, required: true },
    disabled: Boolean,
  },
  setup(props, context) {
    return {
      click: () => {
        if (props.disabled) {
          return;
        }

        context.emit('input', !props.value);
      },
      classes: computed(() => {
        if (props.disabled) {
          return 'bg-gray-400 border-default-lighten-4 cursor-not-allowed';
        }

        if (props.value) {
          return 'bg-primary-darken-3 border-primary cursor-pointer';
        } else {
          return 'bg-default-lighten-1 border-default-lighten-4 cursor-pointer';
        }
      }),
      keydown: (e: KeyboardEvent) => {
        if (e.which === Keys.SPACE) {
          context.emit('input', !props.value);
        }
      },
    };
  },
});
</script>

<style lang="scss" scoped>
.dg-checkbox {
  transition: all linear 250ms;
}

.tick {
  margin-top: -2px;
  border-width: 2px;
  border-top: none;
  border-left: none;
  transition: all linear 250ms;
  transform: rotate(45deg);
  width: 5px;
  height: 10px;
}
</style>