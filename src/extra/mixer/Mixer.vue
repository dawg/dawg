<template>
  <div class="whitespace-no-wrap flex bg-default-lighten-4 h-full">
    <div class="w-full h-full overflow-y-scroll">
      <channel
        v-for="(channel, i) in channels"
        :key="i"
        style="width: 100px"
        :play="play"
        :channel="channel"
        @select="openEffect"
      ></channel>
    </div>
    <effect 
      v-if="openedEffect"
      :effect="openedEffect"
    ></effect>
  </div>
</template>

<script lang="ts">
import Channel from '@/components/Channel.vue';
import { range } from '@/lib/std';
import { AnyEffect, Channel as C } from '@/models';
import { createComponent, ref } from '@vue/composition-api';

export default createComponent({
  components: { Channel },
  name: 'Mixer',
  props: {
    channels: { type: Array as () => C[], required: true  },
    play: { type: Boolean, required: true },
  },
  setup(props, context) {
    const openedEffect = ref<AnyEffect>();

    function openEffect(effect: AnyEffect) {
      if (effect === openedEffect.value) {
        openedEffect.value = undefined;
      } else {
        openedEffect.value = effect;
      }
    }

    return {
      openedEffect,
      openEffect,
    };
  },
});
</script>
