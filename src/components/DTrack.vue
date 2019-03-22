<template>
  <div class="track foreground--text secondary">
    <dot-button
      v-model="active"
    ></dot-button>
    <div class="name">{{ track.name }}</div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Track as T } from '@/schemas';
import { Watch } from '@/modules/update';

@Component
export default class Track extends Vue {
  @Prop({ type: Object, required: true }) public track!: T;
  public active = !this.track.mute;

  @Watch<Track>('active')
  public changeMute() {
    this.track.mute = !this.active;
  }
}
</script>

<style lang="sass" scoped>
// TODO 20px and 5px is hardcoded! 
.track
  display: flex
  border: 0 solid
  border-width: 1px 0
  border-top-color: rgba(255, 255, 255, .07)
  border-bottom-color: rgba(255, 255, 255, .07)
  align-items: center
  padding: 5px 20px 2px 5px
</style>