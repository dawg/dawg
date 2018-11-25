<template>
  <div class="primary footer position white--text" :style="style">
    Vuesic &copy; {{ new Date().getFullYear() }}
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class Foot extends Vue {
  @Prop({ type: [String, Number], default: 22}) public height!: string | number;
  get style() {
    return {
      lineHeight: `${this.height}px`,
    };
  }
}
</script>

<style lang="sass" scoped>
.footer
  width: 100%
  font-size: 12px
  height: 100%
  text-align: center
  position: unset
</style>
