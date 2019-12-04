<template>
  <div class="dg-list">
    <slot>
    </slot>
  </div>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'DgList',
});
</script>

<style lang="scss" scoped>
.dg-list {
  display: flex;
  flex-direction: column;
}
</style>