<template>
  <button 
    class="font-bold py-1 px-3 rounded text-primary outline-none focus:outline-none"
    :class="classes"
    v-on="$listeners"
  >
    <slot></slot>
  </button>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import { literal } from '@/lib/std';

// :class="`bg-${type} hover:bg-${type}-lighten-2 text-${type}`"
export default createComponent({
  name: 'DgButton',
  props: {
    type: { type: String as () => 'text' | 'outline' | 'default', default: literal('default') },
  },
  setup(props) {
    return {
      classes: computed(() => {
        if (props.type === 'outline') {
          return [
            'border ',
            'border-primary-darken-4',
            'focus:border-primary-darken-2',
            'active:border-primary',
            'bg-default-lighten-1',
            'hover:bg-default-lighten-2',
          ];
        } else if (props.type === 'default') {
          return [
            'bg-primary',
            'text-primary',
            'hover:bg-primary-lighten-1',
            'focus:bg-primary-lighten-1',
            'active:bg-primary-lighten-2',
          ];
        } else if (props.type === 'text') {
          return [
            'overlay',
          ];
        }
      }),
    };
  },
});
</script>

<style lang="scss" scoped>
.overlay:hover, .overlay:focus {
  background-color: rgba(255, 255, 255, 0.05);
}

.overlay:active {
  background-color: rgba(255, 255, 255, 0.10);
}
</style>