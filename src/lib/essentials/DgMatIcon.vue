<template>
  <i 
    class="material-icons leading-none"
    v-bind="$attrs"
    v-on="$listeners"
  >
    {{ icon }}
  </i>
</template>

<script lang="ts">
export default {
  name: 'DgMatIcon',
  props: {
    icon: { type: String, required: true },
  },
};
</script>
