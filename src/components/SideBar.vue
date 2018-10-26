<template>
  <section 
    v-show="isActive"
    :aria-hidden="!isActive"
    class="tabs-component-panel"
    :id="name"
    role="tabpanel"
  >
    <slot />
  </section>
</template>

<script lang="ts">
import { TabChild } from '@/mixins/tabParent';
import { Mixins, Component, Prop } from 'vue-property-decorator';

@Component
export default class Sidebar extends Mixins(TabChild) {
  @Prop({type: String, required: true}) public icon!: string;
}
</script>

<style lang="sass" scoped>
</style>