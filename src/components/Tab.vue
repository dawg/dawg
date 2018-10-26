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
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class Tab extends Vue {
  @Prop({ type: String, required: true }) public name!: string;
  public isActive = false;
}
</script>
