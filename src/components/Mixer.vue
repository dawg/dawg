<template>
  <vue-perfect-scrollbar class="mixer secondary-lighten-4" style="height: 100%; width: 100%">
    <channel
      v-for="(channel, i) in channels"
      :key="i"
      :channel="channel"
      @add="addEffect(channel, $event)"
      @select="openEffect"
    ></channel>
    <effect 
      v-if="openedEffect"
      @set="$emit('set', combine({ effect: openedEffect }, $event))"
      :effect="openedEffect"
    ></effect>
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

  public combine(a: object, b: object) {
    return {
      ...a,
      ...b,
    };
  }
}
</script>

<style scoped lang="sass">
.mixer
  white-space: nowrap
  height: 400px
  display: flex
</style>
