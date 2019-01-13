<template>
  <vue-perfect-scrollbar class="mixer secondary-lighten-4" style="height: 100%; width: 100%">
    <channel
      v-for="(channel, i) in channels"
      :key="i"
      :channel="channel"
      @add="addEffect(channel, $event)"
      @select="openEffect"
    ></channel>
    <component 
      v-if="openedEffect" 
      :is="openedEffect.type" 
      :options="openedEffect.options"
    ></component>
    <!-- <phaser :options="{}"></phaser> -->
  </vue-perfect-scrollbar>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import Channel from '@/components/Channel.vue';
import { Channel as C, Effect, AnyEffect } from '@/schemas';
import { Watch } from '@/modules/update';
import { range } from '@/utils';

@Component({
  components: { Channel },
})
export default class Mixer extends Vue {
  @Prop({ type: Array, required: true  }) public channels!: C[];
  public openedEffect: null | AnyEffect = null;

  public addEffect(channel: Channel, { effect, index }: { effect: AnyEffect, index: number }) {
    this.$emit('add', { channel, effect, index });
  }

  public openEffect(effect: AnyEffect) {
    this.openedEffect = effect;
  }
}
</script>

<style scoped lang="sass">
.mixer
  white-space: nowrap
  height: 400px
  display: flex
</style>
