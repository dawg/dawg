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
import { update } from '@/utils';
import { createComponent, onMounted, computed } from '@vue/composition-api';

export default createComponent({
  name: 'Tab',
  props: {
    name: { type: String, required: true },
    selectedTab: { type: String as () => string | undefined, required: false },
  },
  setup(props, context) {
    onMounted(() => {
      if (props.selectedTab === undefined) {
        update(props, context, 'selectedTab', props.name);
      }
    });

    return {
      isActive: computed(() => props.name === props.selectedTab),
    };
  },
});
</script>


<style lang="sass" scoped>
.tab
  height: 100%
</style>
