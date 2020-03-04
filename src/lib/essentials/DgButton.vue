<template>
  <button 
    class="py-1 px-3 relative rounded text-primary outline-none focus:outline-none"
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
    type: { type: String as () => 'text' | 'outline' | 'default' | 'icon', default: literal('default') },
    level: { type: String, default: 'primary' },
  },
  setup(props) {
    return {
      classes: computed(() => {
        if (props.type === 'outline') {
          return [
            'border ',
            `border-${props.level}-darken-4`,
            `focus:border-${props.level}-darken-2`,
            `active:border-${props.level}`,
            'bg-default-lighten-1',
            'hover:bg-default-lighten-2',
          ];
        } else if (props.type === 'default') {
          return [
            `bg-${props.level}`,
            `text-${props.level}`,
            `hover:bg-${props.level}-lighten-1`,
            `focus:bg-${props.level}-lighten-1`,
            `active:bg-${props.level}-lighten-2`,
          ];
        } else if (props.type === 'text') {
          return [
            'overlay',
          ];
        } else if (props.type === 'icon') {
          return [
            'icon',
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

.icon::before {
  content: "";
  opacity: 0;
  border-radius: 50%;
  color: inherit;
  background-color: currentColor;
  bottom: 0;
  left: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  top: 0;
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.6, 1);
}

.icon {
  height: 36px;
  width: 36px;

  &:hover::before {
    opacity: 0.08;
  }
}
</style>