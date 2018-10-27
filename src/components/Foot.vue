<template>
  <v-footer class="primary" :style="style" :height="height" app>
    <span class="position white--text">Vuesic &copy; {{ new Date().getFullYear() }}</span>
  </v-footer>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class Foot extends Vue {
  @Prop({ type: [String, Number], default: 22}) public height!: string | number;
  get style() {
    return {
      minHeight: `${this.height}px`,
    };
  }
}
</script>

<style lang="sass" scoped>
.position
  text-align: center
  width : 100%
  font-size: 12px
</style>
