<template>
  <button 
    class="font-bold py-1 px-3 rounded"
    :class="`bg-${type} hover:bg-${type}-lighten-2 text-${type}`"
    v-on="$listeners"
  >
    <slot></slot>
  </button>
</template>

<script lang="ts">
export default {
  name: 'DgButton',
  props: {
    type: { type: String, default: 'primary' },
  },
};
</script>
