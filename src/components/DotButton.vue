<template>
  <v-btn icon @click="click" class="dot-button">
    <icon name="circle" scale="0.4" :class="color"></icon>
  </v-btn>
</template>

<script lang="ts">
import { computed , createComponent} from '@vue/composition-api';

export default createComponent({
  name: 'DotButton',
  props: {
    value: { type: Boolean, required: true },
  },
  setup(props, context) {
    const color = computed(() => {
      if (props.value) {
        return 'primary--text';
      } else {
        return 'background--text';
      }
    });

    function click(e: MouseEvent) {
      e.stopPropagation();
      context.emit('input', !props.value);
    }

    return {
      color,
      click,
    };
  },
});
</script>

<style lang="scss" scoped>
.dot-button {
  // overriding Vuetify
  height: 20px!important;
  min-width: 20px!important;
  margin: 5px;
}
</style>
