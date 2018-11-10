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
      minHeight: `${this.height}px`,
      height: `${this.height}px`,
      lineHeight: `${this.height}px`,
    };
  }
}
</script>

<style lang="sass" scoped>
.position
  width : 100%
  font-size: 12px

.footer
  text-align: center
  position: unset
</style>
