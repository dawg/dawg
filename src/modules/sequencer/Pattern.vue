<template>
  <div></div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class NAME extends Vue {
  @Prop(String) public PROP!: string;
}
</script>

<style lang="sass" scoped>

</style>