<template>
  <div class="track foreground--text secondary">
    <dot-button
      v-if="!recording"
      v-model="active"
    ></dot-button>
    <dot-button
      v-else
      v-model="recording"
      :value="color"
    ></dot-button>
    <div class="name">{{ track.name }}</div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Watch } from '@/modules/update';
import { Track as T } from '@/core/track';
import { boolean } from 'io-ts';
import * as dawg from '@/dawg';

@Component
export default class Track extends Vue {
  @Prop({ type: Object, required: true }) public track!: T;
  @Prop({ type: Boolean, required: false, default: false }) public recording!: boolean;

  public active = !this.track.mute;

  get color() {
    return dawg.theme.error;
  }

  @Watch<Track>('active')
  public changeMute() {
    this.track.mute = !this.active;
  }
}
</script>

<style lang="sass" scoped>

.name
  user-select: none

// FIXME 20px and 5px is hardcoded! 
.track
  display: flex
  border: 0 solid
  user-select: none
  border-width: 1px 0
  border-top-color: rgba(255, 255, 255, .07)
  border-bottom-color: rgba(255, 255, 255, .07)
  align-items: center
  padding: 5px 20px 2px 5px
</style>