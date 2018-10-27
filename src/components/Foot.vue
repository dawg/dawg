<template>
  <v-footer class="primary" :height="height" app>
    <div class="position white--text">Vuesic &copy; {{ new Date().getFullYear() }}</div>
  </v-footer>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class Foot extends Vue {
  @Prop({type: [String, Number], default: 22}) public height!: string | number;
}
</script>

<style lang="sass" scoped>
.position
  text-align: center
  width : 100%
</style>
