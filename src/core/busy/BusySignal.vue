<template>
  <div class="relative" :style="sizeStyle">

    <div :title="title" class="relative">
      <dg-fa-icon
        class="absolute text-default icon"
        icon="circle"
        :style="iconStyle"
      ></dg-fa-icon>
      <dg-spinner
        v-if="providers.length"
        class="absolute text-default circle"
        :size="size"
        :style="progresStyle"
        :width="1"
        indeterminate
      ></dg-spinner>
    </div>

  </div>
</template>

<script lang="ts">
import { Provider, bus } from '@/core/busy/helpers';
import * as framework from '@/lib/framework';
import { createComponent, computed, onMounted, onUnmounted } from '@vue/composition-api';
import { Disposer } from '@/lib/std';
import { useSubscriptions } from '@/lib/vutils';

export default createComponent({
  name: 'BusySignal',
  props: {
    size: { type: Number, default: 18 },
  },
  setup(props) {
    const iconSize = 7;
    const providers: Provider[] = [];
    const disposers: Disposer[] = [];
    const subscriptions = useSubscriptions();

    const sizeStyle = computed(() => {
      return {
        height: `${props.size}px`,
        width: `${props.size}px`,
      };
    });

    const title = computed(() => {
      if (providers.length === 0) {
        return 'Idle';
      }

      const max = 20;

      return providers.map((provider) => {
        const progress = provider.progress || 0;
        const blocks = Math.round((progress / 100) * max);
        const lines = max - blocks;
        return `${provider.message}\n${'▆'.repeat(blocks)}${'▁'.repeat(lines)} ${progress}%`;
      }).join('\n\n');
    });

    const progresStyle = computed(() => {
      return {
        ...sizeStyle.value,
        top: 0,
        left: 0,
      };
    });

    const iconStyle = computed(() => {
      return {
        left: `${props.size / 2 - iconSize / 2}px`,
        top: `${props.size / 2 - iconSize / 2}px`,
        fontSize: `${iconSize}px`,
      };
    });

    subscriptions.push(bus.on('start', addProvider));

    function addProvider(provider: Provider) {
      if (providers.includes(provider)) {
        return;
      }

      providers.push(provider);
      disposers.push(provider.onDidDispose(removeProvider));
    }

    function removeProvider(provider: Provider) {
      const index = providers.indexOf(provider);
      if (index === -1) {
        return;
      }

      // Remove the event listner
      disposers[index].dispose();

      disposers.splice(index, 1);
      providers.splice(index, 1);
    }

    return {
      sizeStyle,
      title,
      iconStyle,
      providers,
      progresStyle,
    };
  },
});
</script>

<style scoped>
.linear {
  margin-top: 4px;
  margin-bottom: 5px;
}
</style>