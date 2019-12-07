<template>
  <v-popover
    class="relative"
    trigger="hover"
    placement="top"
    :style="sizeStyle"
  >
    <!-- The icon and the spinner -->
    <div>
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

    <!-- The tooltip itself -->
    <div slot="popover">
      <div v-if="!providers.length">
        Idle
      </div>

      <div v-else>
        <div
          v-for="(provider, i) in providers"
          :key="i"
        >
          <div>
            {{ provider.message }}
          </div>
          
          <v-progress-linear
            :color="$theme['text-default']"
            class="linear"
            :height="4"
            v-model="provider.progress"
            :indeterminate="provider.progress === null"
          ></v-progress-linear>
          
          <!-- This is just a little spacer -->
          <div
            :style="spacerStyle"
            v-if="i !== providers.length - 1"
          ></div>
        </div>
      </div>
    </div>

  </v-popover>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Provider, bus } from '@/dawg/extensions/core/busy/helpers';
import * as base from '@/base';

@Component
export default class BusySignal extends Vue {
  @Prop({ type: Number, default: 18 }) public size!: number;

  public iconSize = 7;
  public providers: Provider[] = [];
  public disposers: Array<{ dispose: () => void }> = [];


  get inProgress() {
    return !!this.providers.length;
  }

  get sizeStyle() {
    return {
      height: `${this.size}px`,
      width: `${this.size}px`,
    };
  }

  get progresStyle() {
    return {
      ...this.sizeStyle,
      top: 0,
      left: 0,
    };
  }

  get spacerStyle() {
    return {
      borderColor: base.theme['text-default'] + 50,
      margin: '10px 0',
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