<template>
  <section 
    v-show="isActive"
    :aria-hidden="!isActive"
    class="tab"
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
  @Prop({ type: String, required: false }) public selectedTab?: string;

  get isActive() {
    return this.name === this.selectedTab;
  }

  mounted() {
    if (this.selectedTab === undefined) {
      this.$update('selectedTab', this.name);
    }
  }
}
</script>


<style lang="sass" scoped>
.tab
  height: 100%
</style>
