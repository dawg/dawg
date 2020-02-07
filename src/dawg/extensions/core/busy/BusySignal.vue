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
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Provider, bus } from '@/dawg/extensions/core/busy/helpers';
import * as framework from '@/lib/framework';

@Component
export default class BusySignal extends Vue {
  @Prop({ type: Number, default: 18 }) public size!: number;

  public iconSize = 7;
  public providers: Provider[] = [];
  public disposers: Array<{ dispose: () => void }> = [];

  get sizeStyle() {
    return {
      height: `${this.size}px`,
      width: `${this.size}px`,
    };
  }

  get title() {
    if (this.providers.length === 0) {
      return 'Idle';
    }

    const max = 20;

    return this.providers.map((provider) => {
      const progress = provider.progress || 0;
      const blocks = Math.round((progress / 100) * max);
      const lines = max - blocks;
      return `${provider.message}\n${'▆'.repeat(blocks)}${'▁'.repeat(lines)} ${progress}%`;
    }).join('\n\n');
  }

  get progresStyle() {
    return {
      ...this.sizeStyle,
      top: 0,
      left: 0,
    };
  }

  get iconStyle() {
    return {
      left: `${this.size / 2 - this.iconSize / 2}px`,
      top: `${this.size / 2 - this.iconSize / 2}px`,
      fontSize: `${this.iconSize}px`,
    };
  }

  public mounted() {
    bus.on('start', this.addProvider);
  }

  public addProvider(provider: Provider) {
    if (this.providers.includes(provider)) {
      return;
    }

    this.providers.push(provider);
    this.disposers.push(provider.onDidDispose(this.removeProvider));
  }

  public removeProvider(provider: Provider) {
    const index = this.providers.indexOf(provider);
    if (index === -1) {
      return;
    }

    // Remove the event listner
    this.disposers[index].dispose();

    this.disposers.splice(index, 1);
    this.providers.splice(index, 1);
  }
}
</script>

<style scoped>
.linear {
  margin-top: 4px;
  margin-bottom: 5px;
}
</style>