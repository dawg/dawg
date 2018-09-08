<template>
  <section v-show="isActive"
           :aria-hidden="!isActive"
           class="tabs-component-panel"
           :id="hash"
           role="tabpanel">
    <slot />
  </section>
</template>

<script>
export default {
  name: 'Tab',
  props: {
    name: { required: true },
  },
  data: () => ({
    isActive: false,
  }),
  computed: {
    hash() {
      return `#${this.name.toLowerCase().replace(/ /g, '-')}`;
    },
  },
};
</script>

<style lang="sass" scoped>

</style>
