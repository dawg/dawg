<template>
  <div class="dg-list-item">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'DgListItem',
});
</script>

<style lang="scss" scoped>
@function append($hex, $percent) {
  @return $hex + $percent;
}

.dg-list-item {
  padding: 10px 5px;

  &:hover {
    cursor: pointer;
    background-color: rgba(var(--secondary--rgb), 0.4);
  }
}
</style>