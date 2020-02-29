<template>
  <div class="onoffswitch onoffswitch-inner">
    <div 
      class="upper"
      @click="selectTop"
      :class="topClass"
    ></div>
    <div
      class="lower" 
      @click="selectBottom"
      :class="bottomClass"
    ></div>
  </div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import { update } from '@/lib/vutils';

export default createComponent({
  name: 'VerticalSwitch',
  props: {
    top: { type: Boolean, required: true },
  },
  setup(props, context) {
    const bottom = computed(() => {
      return !props.top;
    });

    const topClass = computed(() => {
      if (props.top) {
        return 'bg-primary';
      } else {
        return 'bg-white';
      }
    });

    const bottomClass = computed(() => {
      if (bottom.value) {
        return 'bg-primary';
      } else {
        return 'bg-white';
      }
    });

    function selectTop() {
      if (!props.top) {
        update(props, context, 'top', true);
      }
    }

    function selectBottom() {
      if (props.top) {
        update(props, context, 'top', false);
      }
    }

    return {
      selectTop,
      topClass,
      selectBottom,
      bottomClass,
    };
  },
});
</script>

<style scoped lang="sass">
$size: 30px

.onoffswitch
  position: relative
  height: $size
  display: flex
  flex-direction: column
  margin-left: 10px

.upper, .lower
  float: left
  height: $size
  width: $size
  border: 2px solid transparent
  background-clip: padding-box
  content: ""
  transition: .5s
  border-radius: 4px

  &:hover
    cursor: pointer
</style>