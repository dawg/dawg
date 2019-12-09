<template>
  <div 
    class="
      h-5
      w-5 
      rounded-sm 
      dg-checkbox 
      relative 
      flex 
      items-center 
      justify-center 
    "
    :class="classes"
    @click="click"
  >
    <span class="focuser"></span>
    <span v-if="value" class="tick h-5 w-3"></span>
  </div>
</template>

<script lang="ts">
import { createComponent, computed, watch } from '@vue/composition-api';

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
    };
  },
});
</script>

<style lang="scss" scoped>
.dg-checkbox {
  position: relative;
  border-width: 1px;
  border-style: solid;
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