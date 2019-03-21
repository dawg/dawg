<template>
  <div></div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { ExtensionData } from '@/modules/explorer/types';
import Tree from '@/modules/explorer/Tree.vue';

@Component
export default class Leaf extends Vue {
  @Prop({ type: Object, required: true }) public data!: ExtensionData<any, any>;

  public $parent!: Tree;
}
</script>

<style lang="sass" scoped>

</style>