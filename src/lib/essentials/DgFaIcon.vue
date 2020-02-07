<template>
  <i 
    class="fa leading-none"
    :class="`fa-${icon}`"
    v-bind="$attrs"
    v-on="$listeners"
  ></i>
</template>

<script lang="ts">
export default {
  name: 'DgFaIcon',
  props: {
    icon: { type: String, required: true },
  },
};
</script>
