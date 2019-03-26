<template>
  <v-tooltip
    class="busy-signal"
    top
    :min-width="200"
  >

    <div slot="activator">
      <icon 
        class="activator icon"
        name="circle" 
        :style="iconStyle"
        :scale="0.4" 
        :color="color"
      ></icon>
      <v-progress-circular
        v-if="providers.length"
        class="activator circle"
        :size="size"
        :color="loadingColor"
        :style="progresStyle"
        :width="1"
        indeterminate
      ></v-progress-circular>
    </div>

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
          :color="$theme.foreground"
          class="linear"
          :height="4"
          :value="provider.progress"
          :indeterminate="provider.progress === null"
        ></v-progress-linear>
        
        <!-- This is just a little spacer -->
        <div
          :style="spacerStyle"
          v-if="i !== providers.length - 1"
        ></div>
      </div>
    </div>

  </v-tooltip>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Provider, bus } from '@/modules/BusySignal/helpers';

@Component
export default class BusySignal extends Vue {
  @Prop({ type: Number, default: 18 }) public size!: number;

  public iconSize = 6;
  public providers: Provider[] = [];
  public loadingColor = this.$theme.foreground;

  get inProgress() {
    return !!this.providers.length;
  }

  get color() {
    return this.$theme.foreground;
  }

  get progresStyle() {
    return {
      marginTop: `${-this.size / 2}px`,
    };
  }

  get spacerStyle() {
    return {
      borderColor: this.$theme.foreground + 50,
      margin: '10px 0',
    };
  }

  get iconStyle() {
    return {
      left: `${this.size / 2 - this.iconSize / 2}px`,
      marginTop: `${-this.iconSize / 2}px`,
    };
  }

  public mounted() {
    bus.$on('start', this.addProvider);
  }

  public addProvider(provider: Provider) {
    if (this.providers.includes(provider)) {
      return;
    }

    provider.$on('dispose', this.removeProvider);
    this.providers.push(provider);
  }

  public removeProvider(provider: Provider) {
    const index = this.providers.indexOf(provider);
    if (index === -1) {
      return;
    }

    provider.$off('dispose', this.removeProvider);
    this.providers.splice(index, 1);
  }
}
</script>

<style scoped>
.busy-signal {
  position: relative;
}

.activator {
  position: absolute;
}

.linear {
  margin-top: 4px;
  margin-bottom: 5px;
}
</style>