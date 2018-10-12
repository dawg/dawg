<template>
  <section 
    v-show="isActive"
    :aria-hidden="!isActive"
    class="tabs-component-panel"
    :id="hash"
    role="tabpanel"
  >
    <slot />
  </section>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component
export default class Tab extends Vue {
  @Prop({ type: String, required: true }) public name!: string;
  public isActive = false;
  get hash() {
    return `#${this.name.toLowerCase().replace(/ /g, '-')}`;
  }
}
</script>

<style lang="sass" scoped>

</style>
