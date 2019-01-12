<template>
  <vue-perfect-scrollbar class="mixer secondary-lighten-4" style="height: 100%; width: 100%">
    <channel
      v-for="(channel, i) in channels"
      :key="i"
      :channel="channel"
    ></channel>
  </vue-perfect-scrollbar>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import Channel from '@/components/Channel.vue';
import { Channel as C } from '@/schemas';
import { Watch } from '@/modules/update';
import { range } from '@/utils';

@Component({
  components: { Channel },
})
export default class Mixer extends Vue {
  @Prop({ type: Array, required: true  }) public channels!: C[];
}
</script>

<style scoped lang="sass">
.mixer
  white-space: nowrap
  height: 400px
</style>
