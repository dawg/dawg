<template>
  <div class="whitespace-no-wrap flex bg-default-lighten-4 h-full">
    <div style="w-full h-full overflow-y-scroll">
      <channel
        v-for="(channel, i) in channels"
        :key="i"
        style="width: 100px"
        :play="play"
        :channel="channel"
        @add="addEffect(channel, $event)"
        @delete="deleteEffect(channel, $event)"
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
import { Component, Prop, Vue } from 'vue-property-decorator';
import Channel from '@/components/Channel.vue';
import { Watch } from '@/modules/update';
import { range } from '@/utils';
import { AnyEffect, Channel as C } from '@/core';

@Component({
  components: { Channel },
})
export default class Mixer extends Vue {
  @Prop({ type: Array, required: true  }) public channels!: C[];
  @Prop({ type: Boolean, required: true }) public play!: boolean;
  public openedEffect: null | AnyEffect = null;

  public addEffect(channel: C, { effect, index }: { effect: AnyEffect, index: number }) {
    this.$emit('add', { channel, effect, index });
  }

  public openEffect(effect: AnyEffect) {
    if (effect === this.openedEffect) {
      this.openedEffect = null;
    } else {
      this.openedEffect = effect;
    }
  }

  public deleteEffect(channel: C, effect: AnyEffect) {
    this.$emit('delete', { channel, effect });
  }
}
</script>
